import { OrderByClause, SheetOptions } from 'spreadorm';
import { applyWhere, applyOrderBy, applySelectLimitOffset } from '../spreadorm/src/utils';
import { describe, it, expect } from 'vitest';

describe('applyWhere', () => {
    it('should filter data based on simple equality', () => {
        const data = [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
        ];
        const where = { id: { eq: 1 } };
        expect(applyWhere(data, where)).toEqual([{ id: 1, name: 'Alice' }]);
    });

    it('should error');

    it('should handle complex conditions', () => {
        const data = [
            { id: 1, age: 30 },
            { id: 2, age: 20 },
        ];
        const where = { age: { gt: 25 } };
        expect(applyWhere(data, where)).toEqual([{ id: 1, age: 30 }]);
    });

    it('should return empty array if no matches', () => {
        const data = [{ id: 1 }];
        const where = { id: { eq: 2 } };
        expect(applyWhere(data, where)).toEqual([]);
    });

    it('should handle multiple conditions', () => {
        const data = [
            { id: 1, age: 20 },
            { id: 2, age: 30 },
            { id: 1, age: 30 },
        ];
        const where = { id: { eq: 1 }, age: { eq: 30 } };
        expect(applyWhere(data, where)).toEqual([{ id: 1, age: 30 }]);
    });
});

describe('applyOrderBy', () => {
    it('should sort data ascending', () => {
        const data = [{ id: 2 }, { id: 1 }];
        const orderBy: OrderByClause<{ id: number }> = { key: 'id', order: 'asc' };
        expect(applyOrderBy(data, orderBy)).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('should sort data descending', () => {
        const data = [{ id: 1 }, { id: 2 }];
        const orderBy: OrderByClause<{ id: number }> = { key: 'id', order: 'desc' };
        expect(applyOrderBy(data, orderBy)).toEqual([{ id: 2 }, { id: 1 }]);
    });

    it('should return original data if orderBy not provided', () => {
        const data = [{ id: 1 }];
        expect(applyOrderBy(data)).toEqual([{ id: 1 }]);
    });
});

describe('applySelectLimitOffset', () => {
    const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
    ];

    it('should apply select correctly', () => {
        const options: SheetOptions<{ id: number }> = { select: ['id'] };
        expect(applySelectLimitOffset(data, options)).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });

    it('should apply limit correctly', () => {
        const options = { limit: 2 };
        expect(applySelectLimitOffset(data, options)).toEqual([
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
        ]);
    });

    it('should apply offset correctly', () => {
        const options = { offset: 1 };
        expect(applySelectLimitOffset(data, options)).toEqual([
            { id: 2, name: 'Bob' },
            { id: 3, name: 'Charlie' },
        ]);
    });

    it('should apply select, limit, and offset together', () => {
        const options: SheetOptions<{ id: number; name: string }> = {
            select: ['name'],
            limit: 1,
            offset: 1,
        };
        expect(applySelectLimitOffset(data, options)).toEqual([{ name: 'Bob' }]);
    });
});
