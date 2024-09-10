export interface SheetOptions<T> {
    where?: WhereClause<T>;
    select?: (keyof T)[];
    orderBy?: OrderByClause<T>;
    limit?: number;
    offset?: number;
}

export type WhereClause<T> = {
    [K in keyof T]?: T[K] | { [op in 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte']?: T[K] };
};

export type OrderByClause<T> = {
    key: keyof T;
    order: 'asc' | 'desc';
};
