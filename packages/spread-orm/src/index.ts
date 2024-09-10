import { parse } from 'papaparse';

interface SheetOptions<T> {
    where?: Partial<T>;
    select?: (keyof T)[];
    orderBy?: {
        key: keyof T;
        order: 'asc' | 'desc';
    };
    limit?: number;
    offset?: number;
}

/**
 * SpreadORM class for interacting with Google Sheets as a simple ORM.
 * @template T The type of the data structure in the sheet.
 */
export class SpreadORM<T> {
    private sheetId: string;
    private data: T[] | null = null;
    private lastFetchTime: number = 0;
    private cacheDuration: number = 5 * 60 * 1000; // 5 minutes

    constructor(sheetId: string, cacheDuration?: number) {
        this.sheetId = sheetId;
        if (cacheDuration) this.cacheDuration = cacheDuration;
    }

    /**
     * Fetches data from the Google Sheet and populates the internal data structure.
     * @private
     */
    private async fetchData(): Promise<void> {
        const now = Date.now();
        if (this.data !== null && now - this.lastFetchTime < this.cacheDuration) return;

        const url = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv`;

        try {
            const response = await fetch(url);
            const text = await response.text();
            const { data } = parse(text, { header: true, dynamicTyping: true });

            this.data = data as T[];
            this.lastFetchTime = now;
        } catch (error) {
            console.error('Error fetching spreadsheet:', error);
            this.data = [];
        }
    }

    /**
     * Finds multiple rows in the sheet based on the provided options.
     * @param {SheetOptions<T>} [options] - Options for filtering, selecting, ordering, and limiting results.
     * @returns {Promise<T[]>} A promise that resolves to an array of matching rows.
     */
    async findMany(options?: SheetOptions<T>): Promise<T[]> {
        await this.fetchData();
        if (!this.data) return [];

        let result = this.data;

        if (options?.where) {
            const whereEntries = Object.entries(options.where) as [keyof T, T[keyof T]][];
            result = result.filter((row) =>
                whereEntries.every(([key, value]) => row[key] === value),
            );
        }

        if (options?.orderBy) {
            const { key, order } = options.orderBy;
            result.sort((a, b) => {
                const aValue = a[key],
                    bValue = b[key];
                return order === 'asc'
                    ? aValue < bValue
                        ? -1
                        : aValue > bValue
                          ? 1
                          : 0
                    : aValue > bValue
                      ? -1
                      : aValue < bValue
                        ? 1
                        : 0;
            });
        }

        if (options?.offset) result = result.slice(options.offset);
        if (options?.limit) result = result.slice(0, options.limit);

        if (options?.select) {
            const selectedKeys = options.select;
            return result.map((row) => {
                const newRow: Partial<T> = {};
                for (const key of selectedKeys) {
                    newRow[key] = row[key];
                }
                return newRow as T;
            });
        }

        return result;
    }

    /**
     * Finds a unique row in the sheet based on the provided options.
     * @param {SheetOptions<T>} [options] - Options for filtering and selecting the unique row.
     * @returns {Promise<Partial<T> | null>} A promise that resolves to the unique row or null if not found.
     * @throws {Error} If multiple results are found.
     */
    async findUnique(options?: SheetOptions<T>): Promise<Partial<T> | null> {
        const results = await this.findMany(options);
        if (results.length > 1) {
            throw new Error('findUnique found multiple results');
        }
        return results[0] || null;
    }

    /**
     * Finds the first row in the sheet that matches the provided options.
     * @param {SheetOptions<T>} [options] - Options for filtering and selecting the first row.
     * @returns {Promise<Partial<T> | null>} A promise that resolves to the first matching row or null if not found.
     */
    async findFirst(options?: SheetOptions<T>): Promise<Partial<T> | null> {
        const results = await this.findMany(options);
        return results[0] || null;
    }

    /**
     * Finds the last row in the sheet that matches the provided options.
     * @param {SheetOptions<T>} [options] - Options for filtering and selecting the last row.
     * @returns {Promise<Partial<T> | null>} A promise that resolves to the last matching row or null if not found.
     */
    async findLast(options?: SheetOptions<T>): Promise<Partial<T> | null> {
        const results = await this.findMany(options);
        return results[results.length - 1] || null;
    }

    /**
     * Counts the number of rows that match the provided options.
     * @param {SheetOptions<T>} [options] - Options for filtering the rows to be counted.
     * @returns {Promise<number>} A promise that resolves to the count of matching rows.
     */
    async count(options?: SheetOptions<T>): Promise<number> {
        const results = await this.findMany(options);
        return results.length;
    }

    /**
     * Resets the internal data cache, forcing a fresh fetch on the next operation.
     */
    async reset(): Promise<void> {
        this.data = null;
        this.lastFetchTime = 0;
    }
}
