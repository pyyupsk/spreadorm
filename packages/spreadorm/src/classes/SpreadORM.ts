import papaparse from 'papaparse';

import type { SheetOptions, ParseOptions } from '../types';

import { FetchError, SpreadORMError, ValidationError } from '../errors/SpreadORMError';
import { applyWhere, applyOrderBy, applySelectLimitOffset } from '../utils';

const { parse } = papaparse;

type CacheOptions = {
    duration?: number;
    enabled?: boolean;
};

/**
 * SpreadORM class for interacting with Google Sheets as a simple ORM.
 * @template T The type of the data structure in the sheet.
 */
export class SpreadORM<T> {
    private sheetId: string;
    private data: T[] | null = null;
    private lastFetchTime: number = 0;
    private cacheEnabled: boolean = true;
    private cacheDuration: number = 5 * 60 * 1000; // 5 minutes
    private parseOptions: ParseOptions;

    /**
     * Creates a new SpreadORM instance.
     * @param {string} sheetId - The ID of the Google Sheet.
     * @param {Object} options - Configuration options
     * @param {CacheOptions} [options.cache] - Cache configuration options
     * - enabled: Whether to enable caching (default: true)
     * - duration: Cache duration in milliseconds (default: 5 minutes)
     * @param {ParseOptions} [options.parseOptions] - CSV parsing options
     * - skipEmptyLines: Whether to skip empty lines (default: true)
     * - transformHeader: Function to transform the header (default: trim whitespace)
     * - delimiter: CSV delimiter (default: ',')
     */
    constructor(
        sheetId: string,
        options?: {
            cache?: CacheOptions;
            parseOptions?: ParseOptions;
        },
    ) {
        if (!sheetId) throw new ValidationError('Sheet ID is required');
        if (typeof sheetId !== 'string') throw new ValidationError('Sheet ID must be a string');

        this.sheetId = sheetId;

        // Cache configuration
        if (options?.cache) {
            if (options.cache.enabled !== undefined) {
                this.cacheEnabled = options.cache.enabled;
            }
            if (options.cache.duration !== undefined) {
                if (typeof options.cache.duration !== 'number' || options.cache.duration <= 0) {
                    throw new ValidationError('Cache duration must be a positive number');
                }
                this.cacheDuration = options.cache.duration;
            }
        }

        this.parseOptions = {
            skipEmptyLines: true,
            transformHeader: (header: string) => header.trim(),
            ...options?.parseOptions,
        };
    }

    private isCacheValid(): boolean {
        if (!this.cacheEnabled || !this.data) return false;
        const now = Date.now();
        return now - this.lastFetchTime < this.cacheDuration;
    }

    private async fetchData(): Promise<void> {
        if (this.isCacheValid()) return;

        if (this.data !== null) {
            this.lastFetchTime = Date.now();
            return;
        }

        const url = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new FetchError(response.statusText || 'Unknown error', response.status);
            }

            const text = await response.text();
            const { data, errors } = parse(text, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: this.parseOptions.skipEmptyLines,
                transformHeader: this.parseOptions.transformHeader,
                delimiter: this.parseOptions.delimiter,
            });

            if (errors.length > 0) {
                throw new ValidationError(
                    `CSV parsing errors: ${errors.map((e) => e.message).join(', ')}`,
                );
            }

            // Remove empty columns (columns with empty headers)
            const cleanData = data.map((row) => {
                const cleanRow: Record<string, unknown> = {};
                Object.entries(row as Record<string, unknown>).forEach(([key, value]) => {
                    if (key.trim() !== '') {
                        cleanRow[key] = value;
                    }
                });
                return cleanRow;
            }) as T[];

            if (cleanData.length === 0) {
                console.warn('No data found in spreadsheet');
                this.data = null;
                return;
            }

            this.data = cleanData;
            this.lastFetchTime = Date.now();
        } catch (error) {
            this.data = null;
            if (error instanceof SpreadORMError) {
                throw error;
            }
            throw new FetchError(error instanceof Error ? error.message : 'Unknown error occurred');
        }
    }

    /**
     * Finds multiple rows in the sheet based on the provided options.
     * @param {SheetOptions<T>} [options] - Options for filtering and selecting the rows.
     * @returns {Promise<T[]>} A promise that resolves to an array of rows.
     */
    async findMany(options?: SheetOptions<T>): Promise<T[]> {
        try {
            await this.fetchData();
            if (!this.data) return [];

            let result = this.data;

            result = applyWhere(result, options?.where);
            result = applyOrderBy(result, options?.orderBy);
            result = applySelectLimitOffset(result, options);

            return result;
        } catch (error) {
            console.error('Error in findMany:', error);
            throw error;
        }
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
            throw new ValidationError('findUnique found multiple results');
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
     * Gets the current cache status
     */
    getCacheStatus(): {
        enabled: boolean;
        valid: boolean;
        lastFetchTime: number | null;
    } {
        return {
            enabled: this.cacheEnabled,
            valid: this.isCacheValid(),
            lastFetchTime: this.lastFetchTime || null,
        };
    }

    /**
     * Updates cache settings
     */
    configureCaching(options: CacheOptions): void {
        if (options.enabled !== undefined) {
            this.cacheEnabled = options.enabled;
        }
        if (options.duration !== undefined) {
            if (typeof options.duration !== 'number' || options.duration <= 0) {
                throw new ValidationError('Cache duration must be a positive number');
            }
            this.cacheDuration = options.duration;
        }
    }

    /**
     * Resets the internal data cache, forcing a fresh fetch on the next operation.
     */
    async reset(): Promise<void> {
        this.data = null;
        this.lastFetchTime = 0;
    }
}
