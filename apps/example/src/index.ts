import { SpreadORM } from 'spreadorm';

interface SheetData {
    id: number;
    title: string;
    description: string;
    url: string;
    published: boolean;
    createdAt: string;
    updatedAt: string;
}

const main = async () => {
    const sheet = new SpreadORM<SheetData>(process.env.SPREADSHEET_ID as string);

    // many
    const many = await sheet.findMany();
    console.log(`Fetched ${many.length} rows:`, many);

    // where
    const where = await sheet.findMany({
        where: {
            published: false,
        },
    });
    console.log(`Fetched ${where.length} rows:`, where);

    // select
    const select = await sheet.findMany({
        where: {
            title: 'Everblush',
        },
        select: ['id', 'title'],
    });
    console.log(`Selected titles:`, select);

    // orderBy
    const orderBy = await sheet.findMany({
        orderBy: {
            key: 'title',
            order: 'asc',
        },
        select: ['title'],
    });
    console.log(`Ordered titles:`, orderBy);

    // limit
    const limit = await sheet.findMany({
        limit: 5,
        select: ['title'],
    });
    console.log(`Limited to 5 rows:`, limit);

    // offset
    const offset = await sheet.findMany({
        offset: 5,
        select: ['title'],
    });
    console.log(`Offset to 5 rows:`, offset);
};

main().catch(console.error);
