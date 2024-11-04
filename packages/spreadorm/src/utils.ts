import type { WhereClause, OrderByClause, WhereOperators } from './types';

/**
 * Applies the where clause to the data.
 * @param {T[]} data - The data to filter.
 * @param {WhereClause<T>} [where] - The where clause to apply.
 * @returns {T[]} The filtered data.
 */
export function applyWhere<T>(data: T[], where?: WhereClause<T>): T[] {
    if (!where) return data;

    return data.filter((row) =>
        Object.entries(where).every(([key, condition]) => {
            const rowValue = row[key as keyof T];

            if (typeof condition === 'object' && condition !== null) {
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
                } = condition as WhereOperators<T>;

                if (eq !== undefined && rowValue !== eq) return false;
                if (ne !== undefined && rowValue === ne) return false;
                if (gt !== undefined && gt !== null && rowValue <= gt) return false;
                if (gte !== undefined && gte !== null && rowValue < gte) return false;
                if (lt !== undefined && lt !== null && rowValue >= lt) return false;
                if (lte !== undefined && lte !== null && rowValue > lte) return false;

                if (contains !== undefined && typeof rowValue === 'string') {
                    return rowValue.includes(contains);
                }
                if (startsWith !== undefined && typeof rowValue === 'string') {
                    return rowValue.startsWith(startsWith);
                }
                if (endsWith !== undefined && typeof rowValue === 'string') {
                    return rowValue.endsWith(endsWith);
                }
                if (inArray !== undefined) {
                    return (inArray as T[]).includes(rowValue as T);
                }
                if (notIn !== undefined) {
                    return !(notIn as T[]).includes(rowValue as T);
                }
            } else if (rowValue !== condition) {
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
export function applyOrderBy<T>(data: T[], orderBy?: OrderByClause<T> | OrderByClause<T>[]): T[] {
    if (!orderBy) return data;

    const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];

    return [...data].sort((a, b) => {
        for (const { key, order } of orderByArray) {
            const aValue = a[key];
            const bValue = b[key];

            if (aValue === bValue) continue;

            if (order === 'asc') {
                return aValue < bValue ? -1 : 1;
            } else {
                return aValue > bValue ? -1 : 1;
            }
        }
        return 0;
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
