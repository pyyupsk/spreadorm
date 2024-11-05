import type { WhereOperators } from './WhereOperators';

export type WhereClause<T> = {
    [K in keyof T]?: T[K] | WhereOperators<T[K]>;
};
