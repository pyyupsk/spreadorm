import { parse } from 'papaparse';

import type { SheetOptions } from './types';

import { applyWhere, applyOrderBy, applySelectLimitOffset } from './utils';

/**
 * SpreadORM class for interacting with Google Sheets as a simple ORM.
 * @template T The type of the data structure in the sheet.
 */
export class SpreadORM<T> {
    private sheetId: string;
    private data: T[] | null = null;
    private lastFetchTime: number = 0;
    private cacheDuration: number = 5 * 60 * 1000; // 5 minutes

    /**
     * Creates a new SpreadORM instance.
     * @param {string} sheetId - The ID of the Google Sheet.
     * @param {number} [cacheDuration] - The duration for which the data is cached, in milliseconds. Defaults to 5 minutes.
     * @throws {Error} If the sheet ID is not provided.
     */
    constructor(sheetId: string, cacheDuration?: number) {
        if (!sheetId) throw new Error('Sheet ID is required');

        this.sheetId = sheetId;
        if (cacheDuration) this.cacheDuration = cacheDuration;
    }

    private async fetchData(): Promise<void> {
        const now = Date.now();
        if (this.data !== null && now - this.lastFetchTime < this.cacheDuration) return;

        const url = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch spreadsheet: ${response.statusText}`);
            }

            const text = await response.text();
            const { data } = parse(text, {
                header: true,
                dynamicTyping: true,
            });

            this.data = data.filter((row: unknown) => {
                return Object.values(row as Record<string, unknown>).some(
                    (value: unknown) => value !== '',
                );
            }) as T[];
            this.lastFetchTime = now;
        } catch (error) {
            this.data = [];
            console.error('Error fetching spreadsheet:', error);
            throw error;
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
