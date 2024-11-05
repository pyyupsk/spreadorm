export type OrderByClause<T> = {
    key: keyof T;
    order: 'asc' | 'desc';
};
