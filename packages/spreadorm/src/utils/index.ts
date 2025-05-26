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

    return Object.keys(value).every((key) => validKeys.includes(key));
}

/**
 * Handles numeric operators and returns a boolean
 */
function handleNumericOperators(value: number, condition: WhereOperators<number>): boolean {
    const { gt, gte, lt, lte } = condition;
    if (gt !== undefined && typeof gt === 'number') return value > gt;
    if (gte !== undefined && typeof gte === 'number') return value >= gte;
    if (lt !== undefined && typeof lt === 'number') return value < lt;
    if (lte !== undefined && typeof lte === 'number') return value <= lte;
    return true;
}

/**
 * Handles string operators and returns a boolean
 */
function handleStringOperators(value: string, condition: WhereOperators<string>): boolean {
    const { contains, startsWith, endsWith } = condition;
    if (contains !== undefined && typeof contains === 'string') return value.includes(contains);
    if (startsWith !== undefined && typeof startsWith === 'string')
        return value.startsWith(startsWith);
    if (endsWith !== undefined && typeof endsWith === 'string') return value.endsWith(endsWith);
    return true;
}

/**
 * Handles array operators and returns a boolean
 */
function handleArrayOperators<T>(value: T, condition: WhereOperators<T>): boolean {
    const { in: inArray, notIn } = condition;
    if (inArray !== undefined && Array.isArray(inArray)) {
        return inArray.includes(value);
    }
    if (notIn !== undefined && Array.isArray(notIn)) {
        return !notIn.includes(value);
    }
    return true;
}

/**
 * Handles a WhereOperators object and returns a boolean
 */
function handleWhereOperator<T>(
    rowValue: T[keyof T],
    condition: WhereOperators<T[keyof T]>,
): boolean {
    const { eq, ne, in: inArray, notIn } = condition;

    if (eq !== undefined) return rowValue === eq;
    if (ne !== undefined) return rowValue !== ne;

    if (typeof rowValue === 'number') {
        if (inArray !== undefined || notIn !== undefined) {
            return handleArrayOperators(rowValue, condition);
        }
        return handleNumericOperators(rowValue as number, condition as WhereOperators<number>);
    }

    if (typeof rowValue === 'string') {
        if (inArray !== undefined || notIn !== undefined) {
            return handleArrayOperators(rowValue, condition);
        }
        return handleStringOperators(rowValue as string, condition as WhereOperators<string>);
    }

    return handleArrayOperators(rowValue, condition);
}

/**
 * Evaluates a single condition for a row
 */
function evaluateCondition<T>(row: T, key: keyof T, condition: unknown): boolean {
    const rowValue = row[key];

    if (rowValue === null) {
        return condition === null;
    }

    if (isWhereOperator<T[keyof T]>(condition)) {
        return handleWhereOperator(rowValue, condition);
    }

    return rowValue === condition;
}

/**
 * Applies the where clause to the data with improved type checking.
 */
export function applyWhere<T>(data: T[], where?: WhereClause<T>): T[] {
    if (!where) return data;

    return data.filter((row) =>
        Object.entries(where).every(([key, condition]) =>
            evaluateCondition(row, key as keyof T, condition),
        ),
    );
}

/**
 * Compares two values based on their type.
 */
function compareByType(a: unknown, b: unknown): number {
    if (typeof a === 'string' && typeof b === 'string') {
        return a.localeCompare(b);
    }
    if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
    }
    return String(a).localeCompare(String(b));
}

/**
 * Compares two values based on their type and order.
 */
function compareValues(a: unknown, b: unknown, order: 'asc' | 'desc'): number {
    if (a === undefined || a === null) return order === 'asc' ? 1 : -1;
    if (b === undefined || b === null) return order === 'asc' ? -1 : 1;
    if (typeof a !== typeof b) {
        return compareByType(a, b) * (order === 'asc' ? 1 : -1);
    }

    return compareByType(a, b) * (order === 'asc' ? 1 : -1);
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

/**
 * Applies the select and limit/offset clauses to the data with improved type checking.
 */
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
