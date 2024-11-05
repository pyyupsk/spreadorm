import { applyWhere, applyOrderBy, applySelectLimitOffset } from '../spreadorm/src/utils';
import { ValidationError } from '../spreadorm/src/errors/SpreadORMError';
import { describe, it, expect } from 'vitest';

type TestData = {
    id: number;
    name: string;
    age: number;
    email: string;
};

describe('SpreadORM Utils', () => {
    const testData: TestData[] = [
        { id: 1, name: 'Alice', age: 25, email: 'alice@test.com' },
        { id: 2, name: 'Bob', age: 30, email: 'bob@test.com' },
        { id: 3, name: 'Charlie', age: 35, email: 'charlie@test.com' },
        { id: 4, name: 'David', age: 28, email: 'david@test.com' },
    ];

    describe('applyWhere', () => {
        it('should filter with simple equality', () => {
            const result = applyWhere(testData, { name: { eq: 'Alice' } });
            expect(result).toEqual([testData[0]]);
        });

        it('should filter with not equal', () => {
            const result = applyWhere(testData, { name: { ne: 'Alice' } });
            expect(result).toEqual([testData[1], testData[2], testData[3]]);
        });

        it('should filter with greater than', () => {
            const result = applyWhere(testData, { age: { gt: 30 } });
            expect(result).toEqual([testData[2]]);
        });

        it('should filter with less than or equal', () => {
            const result = applyWhere(testData, { age: { lte: 28 } });
            expect(result).toEqual([testData[0], testData[3]]);
        });

        it('should filter with contains', () => {
            const result = applyWhere(testData, { email: { contains: 'bob' } });
            expect(result).toEqual([testData[1]]);
        });

        it('should filter with startsWith', () => {
            const result = applyWhere(testData, { name: { startsWith: 'B' } });
            expect(result).toEqual([testData[1]]);
        });

        it('should filter with endsWith', () => {
            const result = applyWhere(testData, { name: { endsWith: 'ie' } });
            expect(result).toEqual([testData[2]]);
        });

        it('should filter with in array', () => {
            const result = applyWhere(testData, { name: { in: ['Alice', 'Bob'] } });
            expect(result).toEqual([testData[0], testData[1]]);
        });

        it('should filter with notIn array', () => {
            const result = applyWhere(testData, { name: { notIn: ['Alice', 'Bob'] } });
            expect(result).toEqual([testData[2], testData[3]]);
        });
    });

    describe('applyOrderBy', () => {
        it('should sort by single field ascending', () => {
            const result = applyOrderBy(testData, { key: 'age', order: 'asc' });
            expect(result).toEqual([
                testData[0], // Alice: 25
                testData[3], // David: 28
                testData[1], // Bob: 30
                testData[2], // Charlie: 35
            ]);
        });

        it('should sort by single field descending', () => {
            const result = applyOrderBy(testData, { key: 'age', order: 'desc' });
            expect(result).toEqual([
                testData[2], // Charlie: 35
                testData[1], // Bob: 30
                testData[3], // David: 28
                testData[0], // Alice: 25
            ]);
        });

        it('should sort by multiple fields', () => {
            const data = [...testData, { id: 5, name: 'Eve', age: 28, email: 'eve@test.com' }];
            const result = applyOrderBy(data, [
                { key: 'age', order: 'asc' },
                { key: 'name', order: 'desc' },
            ]);
            expect(result[2].name).toBe('David'); // Among age 28, David should come before Bob
        });
    });

    describe('applySelectLimitOffset', () => {
        it('should select specific fields', () => {
            const result = applySelectLimitOffset(testData, { select: ['name', 'age'] });
            expect(result).toEqual([
                { name: 'Alice', age: 25 },
                { name: 'Bob', age: 30 },
                { name: 'Charlie', age: 35 },
                { name: 'David', age: 28 },
            ]);
        });

        it('should apply limit', () => {
            const result = applySelectLimitOffset(testData, { limit: 2 });
            expect(result).toEqual([testData[0], testData[1]]);
        });

        it('should apply offset', () => {
            const result = applySelectLimitOffset(testData, { offset: 2 });
            expect(result).toEqual([testData[2], testData[3]]);
        });

        it('should apply limit and offset together', () => {
            const result = applySelectLimitOffset(testData, { limit: 1, offset: 1 });
            expect(result).toEqual([testData[1]]);
        });

        it('should apply select, limit, and offset together', () => {
            const result = applySelectLimitOffset(testData, {
                select: ['name', 'age'],
                limit: 2,
                offset: 1,
            });
            expect(result).toEqual([
                { name: 'Bob', age: 30 },
                { name: 'Charlie', age: 35 },
            ]);
        });
    });

    describe('applySelectLimitOffset validation', () => {
        it('should throw ValidationError for negative offset', () => {
            expect(() => {
                applySelectLimitOffset(testData, { offset: -1 });
            }).toThrow(new ValidationError('Offset must be a non-negative number'));
        });

        it('should throw ValidationError for negative limit', () => {
            expect(() => {
                applySelectLimitOffset(testData, { limit: -1 });
            }).toThrow(new ValidationError('Limit must be a non-negative number'));
        });

        it('should throw ValidationError for invalid select field', () => {
            expect(() => {
                applySelectLimitOffset(testData, {
                    // @ts-expect-error
                    select: ['invalid'],
                });
            }).toThrow(new ValidationError('Invalid select keys: invalid'));
        });

        it('should throw ValidationError for non-array select', () => {
            expect(() => {
                applySelectLimitOffset(testData, {
                    // @ts-expect-error
                    select: 'name',
                });
            }).toThrow(new ValidationError('Select must be an array of keys'));
        });
    });

    describe('applyWhere with null values', () => {
        const dataWithNull = [
            ...testData,
            { id: 5, name: 'Eve', age: null as unknown as number, email: 'eve@test.com' },
        ];

        it('should handle null equality', () => {
            const result = applyWhere(dataWithNull, {
                // @ts-expect-error
                age: null,
            });
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Eve');
        });

        it('should handle numeric comparisons with null values', () => {
            const result = applyWhere(dataWithNull, { age: { gt: 25 } });
            expect(result).toHaveLength(3);
            expect(result.every((r) => r.age > 25)).toBe(true);
        });
    });

    describe('applyOrderBy with null values', () => {
        const dataWithNull = [
            ...testData,
            { id: 5, name: 'Eve', age: null as unknown as number, email: 'eve@test.com' },
        ];

        it('should handle null values in ascending order', () => {
            const result = applyOrderBy(dataWithNull, { key: 'age', order: 'asc' });
            expect(result[result.length - 1].name).toBe('Charlie');
        });

        it('should handle null values in descending order', () => {
            const result = applyOrderBy(dataWithNull, { key: 'age', order: 'desc' });
            expect(result[0].name).toBe('Charlie');
            expect(result[result.length - 1].name).toBe('Alice');
        });
    });
});
