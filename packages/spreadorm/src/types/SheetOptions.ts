import type { OrderByClause } from './OrderByClause';
import type { WhereClause } from './WhereClause';

export type SheetOptions<T> = {
    where?: WhereClause<T>;
    select?: (keyof T)[];
    orderBy?: OrderByClause<T> | OrderByClause<T>[];
    limit?: number;
    offset?: number;
};
