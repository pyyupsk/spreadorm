import { SpreadORM } from 'spreadorm';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FetchError, ValidationError } from '../spreadorm/src/errors/SpreadORMError';

describe('SpreadORM', () => {
    const orm = new SpreadORM<{ id: number; name: string }>('dummy-sheet-id');

    // Mock both fetch calls (one for version, one for data)
    beforeEach(() => {
        vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('id,name\n1,Alice\n2,Bob'),
            statusText: 'OK',
        } as Response);
        orm.reset();
    });

    it('should find many with simple conditions', async () => {
        const results = await orm.findMany({ where: { name: { eq: 'Alice' } } });
        expect(results).toEqual([{ id: 1, name: 'Alice' }]);
    });

    it('should handle findUnique correctly', async () => {
        const result = await orm.findUnique({ where: { id: { eq: 1 } } });
        expect(result).toEqual({ id: 1, name: 'Alice' });
    });

    it('should throw error on findUnique with multiple results', async () => {
        await expect(orm.findUnique({ where: { name: { ne: 'unknown' } } })).rejects.toThrow(
            'findUnique found multiple results',
        );
    });

    it('should find the first matching entry', async () => {
        const result = await orm.findFirst({ where: { name: { ne: 'unknown' } } });
        expect(result).toEqual({ id: 1, name: 'Alice' });
    });

    it('should find the last matching entry', async () => {
        const result = await orm.findLast({ where: { name: { ne: 'unknown' } } });
        expect(result).toEqual({ id: 2, name: 'Bob' });
    });

    it('should count matching entries', async () => {
        const count = await orm.count({ where: { name: { ne: 'unknown' } } });
        expect(count).toBe(2);
    });

    it('should handle complex where conditions', async () => {
        const results = await orm.findMany({
            where: {
                name: { in: ['Alice', 'Bob'] },
            },
        });
        expect(results).toEqual([
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
        ]);
    });

    it('should handle orderBy with findMany', async () => {
        const results = await orm.findMany({
            orderBy: { key: 'name', order: 'desc' },
        });
        expect(results).toEqual([
            { id: 2, name: 'Bob' },
            { id: 1, name: 'Alice' },
        ]);
    });

    it('should handle select fields', async () => {
        const results = await orm.findMany({
            select: ['name'],
        });
        expect(results).toEqual([{ name: 'Alice' }, { name: 'Bob' }]);
    });

    it('should handle pagination', async () => {
        const results = await orm.findMany({
            limit: 1,
            offset: 1,
        });
        expect(results).toEqual([{ id: 2, name: 'Bob' }]);
    });

    it('should handle combined query options', async () => {
        const results = await orm.findMany({
            where: { name: { ne: 'unknown' } },
            orderBy: { key: 'name', order: 'asc' },
            select: ['name'],
            limit: 1,
        });
        expect(results).toEqual([{ name: 'Alice' }]);
    });

    it('should throw error when sheet ID is invalid', async () => {
        const invalidOrm = new SpreadORM('invalid-id');
        vi.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: false,
            statusText: 'Not Found',
        } as Response);

        await expect(invalidOrm.findMany({})).rejects.toThrow(
            'Failed to fetch spreadsheet: Not Found',
        );
    });

    // Add new tests for cache functionality
    describe('caching', () => {
        it('should configure cache settings', () => {
            orm.configureCaching({ enabled: false });
            const status = orm.getCacheStatus();
            expect(status.enabled).toBe(false);
        });

        it('should throw error for invalid cache duration', () => {
            expect(() => {
                orm.configureCaching({ duration: -1 });
            }).toThrow(new ValidationError('Cache duration must be a positive number'));
        });

        it('should return cache status', async () => {
            await orm.findMany({});
            const status = orm.getCacheStatus();
            expect(status).toEqual({
                enabled: false,
                valid: false,
                lastFetchTime: expect.any(Number),
            });
        });
    });

    // Add new tests for error handling
    describe('error handling', () => {
        it('should throw ValidationError for invalid sheet ID', () => {
            expect(() => {
                new SpreadORM('');
            }).toThrow(new ValidationError('Sheet ID is required'));
        });

        it('should throw FetchError for network issues', async () => {
            vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));
            await expect(orm.findMany({})).rejects.toThrow(new FetchError('Network error'));
        });

        it('should throw ValidationError for invalid cache configuration', () => {
            expect(() => {
                new SpreadORM('valid-id', {
                    cache: { duration: -1 },
                });
            }).toThrow(new ValidationError('Cache duration must be a positive number'));
        });

        it('should handle CSV parsing errors', async () => {
            vi.spyOn(global, 'fetch').mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve('invalid,csv,data\n1,2'),
            } as Response);

            await expect(orm.findMany({})).rejects.toThrow(
                new ValidationError(
                    'CSV parsing errors: Too few fields: expected 3 fields but parsed 2',
                ),
            );
        });
    });

    // Add constructor tests
    describe('constructor', () => {
        it('should accept cache configuration', () => {
            const customOrm = new SpreadORM('test-id', {
                cache: {
                    enabled: false,
                    duration: 10000,
                },
            });
            const status = customOrm.getCacheStatus();
            expect(status.enabled).toBe(false);
        });

        it('should use default cache settings when not specified', () => {
            const defaultOrm = new SpreadORM('test-id');
            const status = defaultOrm.getCacheStatus();
            expect(status.enabled).toBe(true);
        });
    });
});
