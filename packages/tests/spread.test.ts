import { SpreadORM } from 'spreadorm';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('SpreadORM', () => {
    const orm = new SpreadORM<{ id: number; name: string }>('dummy-sheet-id');
    vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('id,name\n1,Alice\n2,Bob'),
        statusText: 'OK',
    } as Response);

    beforeEach(() => {
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
});
