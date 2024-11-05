import type { WhereOperators, OrderByClause, WhereClause, SheetOptions } from '../types';

import { ValidationError } from '../errors/SpreadORMError';

/**
 * Type guard to check if a value is a WhereOperators object
 */
function isWhereOperator<T>(value: unknown): value is WhereOperators<T> {
    if (typeof value !== 'object' || value === null) return false;

    const validKeys = [
        'eq',
        'ne',
        'gt',
        'gte',
        'lt',
        'lte',
        'contains',
        'startsWith',
        'endsWith',
        'in',
        'notIn',
    ];

    return Object.keys(value as object).every((key) => validKeys.includes(key));
}

/**
 * Applies the where clause to the data with improved type checking.
 */
export function applyWhere<T>(data: T[], where?: WhereClause<T>): T[] {
    if (!where) return data;

    return data.filter((row) =>
        Object.entries(where).every(([key, condition]) => {
            const rowValue = row[key as keyof T];

            // Handle null values
            if (rowValue === null) {
                if (condition === null) return true;
                return false;
            }

            // Validate the condition structure
            if (isWhereOperator<T[keyof T]>(condition)) {
                const {
                    eq,
                    ne,
                    gt,
                    gte,
                    lt,
                    lte,
                    contains,
                    startsWith,
                    endsWith,
                    in: inArray,
                    notIn,
                } = condition;

                // Type-safe comparisons
                if (eq !== undefined) return rowValue === eq;
                if (ne !== undefined) return rowValue !== ne;

                // Numeric comparisons
                if (typeof rowValue === 'number') {
                    if (gt !== undefined && typeof gt === 'number') return rowValue > gt;
                    if (gte !== undefined && typeof gte === 'number') return rowValue >= gte;
                    if (lt !== undefined && typeof lt === 'number') return rowValue < lt;
                    if (lte !== undefined && typeof lte === 'number') return rowValue <= lte;
                }

                // String operations
                if (typeof rowValue === 'string') {
                    if (contains !== undefined && typeof contains === 'string') {
                        return rowValue.includes(contains);
                    }
                    if (startsWith !== undefined && typeof startsWith === 'string') {
                        return rowValue.startsWith(startsWith);
                    }
                    if (endsWith !== undefined && typeof endsWith === 'string') {
                        return rowValue.endsWith(endsWith);
                    }
                }

                // Array operations
                if (inArray !== undefined && Array.isArray(inArray)) {
                    return inArray.includes(rowValue);
                }
                if (notIn !== undefined && Array.isArray(notIn)) {
                    return !notIn.includes(rowValue);
                }

                return true;
            }

            // Direct value comparison
            return rowValue === condition;
        }),
    );
}

/**
 * Safely compares two values for ordering
 */
function compareValues(a: unknown, b: unknown, order: 'asc' | 'desc'): number {
    // Handle undefined/null values
    if (a === undefined || a === null) return order === 'asc' ? 1 : -1;
    if (b === undefined || b === null) return order === 'asc' ? -1 : 1;

    // Handle different types
    if (typeof a !== typeof b) {
        return String(a).localeCompare(String(b)) * (order === 'asc' ? 1 : -1);
    }

    // Type-specific comparisons
    if (typeof a === 'string' && typeof b === 'string') {
        return a.localeCompare(b) * (order === 'asc' ? 1 : -1);
    }

    if (typeof a === 'number' && typeof b === 'number') {
        return (a - b) * (order === 'asc' ? 1 : -1);
    }

    // Fallback to string comparison
    return String(a).localeCompare(String(b)) * (order === 'asc' ? 1 : -1);
}

/**
 * Applies the order by clause to the data with improved null handling.
 */
export function applyOrderBy<T>(data: T[], orderBy?: OrderByClause<T> | OrderByClause<T>[]): T[] {
    if (!orderBy) return data;

    const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];

    // Remove null values from data
    const filteredData = data.filter((row) =>
        Object.values(row as object).every((value) => value !== null),
    );

    return [...filteredData].sort((a, b) => {
        for (const { key, order } of orderByArray) {
            const aValue = a[key];
            const bValue = b[key];

            const comparison = compareValues(aValue, bValue, order);
            if (comparison !== 0) return comparison;
        }
        return 0;
    });
}

/**
 * Validates if a key exists in the data structure
 */
function isValidKey<T>(data: T[], key: keyof T): boolean {
    return Object.keys(data[0] as object).includes(key.toString());
}

export function applySelectLimitOffset<T>(data: T[], options?: SheetOptions<T>): T[] {
    let result = data;

    // Validate and apply offset
    if (options?.offset !== undefined) {
        if (typeof options.offset !== 'number' || options.offset < 0) {
            throw new ValidationError('Offset must be a non-negative number');
        }
        result = result.slice(options.offset);
    }

    // Validate and apply limit
    if (options?.limit !== undefined) {
        if (typeof options.limit !== 'number' || options.limit < 0) {
            throw new ValidationError('Limit must be a non-negative number');
        }
        result = result.slice(0, options.limit);
    }

    // Validate and apply select
    if (options?.select) {
        if (!Array.isArray(options.select)) {
            throw new ValidationError('Select must be an array of keys');
        }

        // Validate all keys before processing
        const invalidKeys = options.select.filter((key) => !isValidKey(data, key));
        if (invalidKeys.length > 0) {
            throw new ValidationError(`Invalid select keys: ${invalidKeys.join(', ')}`);
        }

        return result.map((row) => {
            const newRow: Partial<T> = {};
            if (!options?.select) return newRow as T;
            for (const key of options.select) {
                newRow[key] = row[key];
            }
            return newRow as T;
        });
    }

    return result;
}
