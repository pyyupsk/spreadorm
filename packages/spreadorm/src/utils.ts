import type { WhereClause, OrderByClause } from './types';

/**
 * Applies the where clause to the data.
 * @param {T[]} data - The data to filter.
 * @param {WhereClause<T>} [where] - The where clause to apply.
 * @returns {T[]} The filtered data.
 */
export function applyWhere<T>(data: T[], where?: WhereClause<T>): T[] {
    if (!where) return data;

    return data.filter((row) =>
        Object.entries(where).every(([key, value]) => {
            const rowValue = row[key as keyof T];
            if (typeof value === 'object' && value !== null) {
                const { eq, ne, gt, gte, lt, lte } = value as {
                    eq?: T[keyof T];
                    ne?: T[keyof T];
                    gt?: T[keyof T];
                    gte?: T[keyof T];
                    lt?: T[keyof T];
                    lte?: T[keyof T];
                };
                if (eq !== undefined && rowValue !== eq) return false;
                if (ne !== undefined && rowValue === ne) return false;
                if (gt !== undefined && gt !== null && rowValue <= gt) return false;
                if (gte !== undefined && gte !== null && rowValue < gte) return false;
                if (lt !== undefined && lt !== null && rowValue >= lt) return false;
                if (lte !== undefined && lte !== null && rowValue > lte) return false;
            } else if (rowValue !== value) {
                return false;
            }
            return true;
        }),
    );
}

/**
 * Applies the order by clause to the data.
 * @param {T[]} data - The data to sort.
 * @param {OrderByClause<T>} [orderBy] - The order by clause to apply.
 * @returns {T[]} The sorted data.
 */
export function applyOrderBy<T>(data: T[], orderBy?: OrderByClause<T>): T[] {
    if (!orderBy) return data;

    const { key, order } = orderBy;
    return [...data].sort((a, b) => {
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

/**
 * Applies the select, limit, and offset options to the data.
 * @param {T[]} data - The data to modify.
 * @param {SheetOptions<T>} [options] - The options to apply.
 * @returns {T[]} The modified data.
 */
export function applySelectLimitOffset<T>(
    data: T[],
    options?: { select?: (keyof T)[]; offset?: number; limit?: number },
): T[] {
    let result = data;

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
