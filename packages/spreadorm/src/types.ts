export interface SheetOptions<T> {
    where?: WhereClause<T>;
    select?: (keyof T)[];
    orderBy?: OrderByClause<T> | OrderByClause<T>[];
    limit?: number;
    offset?: number;
}

export type WhereOperators<T> = {
    eq?: T;
    ne?: T;
    gt?: T;
    gte?: T;
    lt?: T;
    lte?: T;
    contains?: string;
    startsWith?: string;
    endsWith?: string;
    in?: T[];
    notIn?: T[];
};

export type WhereClause<T> = {
    [K in keyof T]?: T[K] | WhereOperators<T[K]>;
};

export type OrderByClause<T> = {
    key: keyof T;
    order: 'asc' | 'desc';
};

export interface ParseOptions {
    skipEmptyLines?: boolean;
    transformHeader?: (header: string) => string;
    delimiter?: string;
    encoding?: string;
}
