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
