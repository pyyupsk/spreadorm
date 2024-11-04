import chalk from 'chalk';
import { SpreadORM } from 'spreadorm';

// Define the type for our sales data
interface SalesData {
    Date: string;
    Region: string;
    Category: string;
    ProductName: string;
    UnitPrice: number;
    Quantity: number;
    Revenue: number;
    Cost: number;
    CustomerId: string;
    CustomerName: string;
    SalesRepId: string;
    Status: string;
}

// Initialize SpreadORM with your Google Sheet ID
const SHEET_ID = '1TwFj6sp-I14c49t8n8mSGD1QVv9_uCwMpzzN0s01iPE';
const salesOrm = new SpreadORM<SalesData>(SHEET_ID, {
    cacheDuration: 5 * 60 * 1000, // 5 minutes cache
    parseOptions: {
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
    },
});

// Helper function to print section headers
function printSection(title: string) {
    console.log('\n' + chalk.bold.blue('═'.repeat(50)));
    console.log(chalk.bold.yellow(` 📊 ${title}`));
    console.log(chalk.bold.blue('═'.repeat(50)) + '\n');
}

// Helper function to format currency
function formatCurrency(amount: number): string {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });
    return formatter.format(amount);
}

async function main() {
    try {
        // Example 1: Find all Electronics products
        printSection('Electronics Products');
        const electronics = await salesOrm.findMany({
            where: { Category: 'Electronics' },
        });
        console.table(
            electronics.map(({ ProductName, UnitPrice, Revenue, Category }) => ({
                Product: ProductName,
                Price: formatCurrency(UnitPrice),
                Revenue: formatCurrency(Revenue),
                Category,
            })),
        );

        // Example 2: High Revenue Products
        printSection('Top Revenue Products (> $2000)');
        const highRevenue = await salesOrm.findMany({
            where: { Revenue: { gt: 2000 } },
            orderBy: { key: 'Revenue', order: 'desc' },
        });
        console.table(
            highRevenue.map(({ ProductName, Revenue, CustomerName }) => ({
                Product: ProductName,
                Revenue: formatCurrency(Revenue),
                Customer: CustomerName,
            })),
        );

        // Example 3: Regional Analysis
        printSection('North & South Region Sales');
        const northSouthSales = await salesOrm.findMany({
            where: { Region: { in: ['North', 'South'] } },
        });
        const regionalSummary = northSouthSales.reduce(
            (acc, sale) => {
                acc[sale.Region] = (acc[sale.Region] || 0) + sale.Revenue;
                return acc;
            },
            {} as Record<string, number>,
        );

        Object.entries(regionalSummary).forEach(([region, revenue]) => {
            console.log(chalk.green(`${region}: ${formatCurrency(revenue)}`));
        });

        // Example 4: Sales Statistics
        printSection('Overall Sales Statistics');
        const salesStats = await calculateSalesStats();
        console.log(chalk.cyan('Revenue Metrics:'));
        console.log(`Total Revenue: ${chalk.green(formatCurrency(salesStats.totalRevenue))}`);
        console.log(`Total Profit: ${chalk.green(formatCurrency(salesStats.totalProfit))}`);
        console.log(`Average Order: ${chalk.green(formatCurrency(salesStats.averageOrderValue))}`);

        console.log(chalk.cyan('\nCategory Performance:'));
        Object.entries(salesStats.categorySummary).forEach(([category, data]) => {
            console.log(
                chalk.white(`${category}: `) +
                    chalk.green(formatCurrency(data.revenue)) +
                    chalk.gray(` (${data.count} orders)`),
            );
        });
    } catch (error) {
        console.error(chalk.red('Error running examples:'), error);
    }
}

// Helper function to calculate sales statistics
async function calculateSalesStats() {
    const allSales = await salesOrm.findMany();

    const stats = {
        totalRevenue: allSales.reduce((sum, sale) => sum + sale.Revenue, 0),
        totalCost: allSales.reduce((sum, sale) => sum + sale.Cost, 0),
        totalProfit: 0,
        averageOrderValue: 0,
        totalOrders: allSales.length,
        categorySummary: {} as Record<string, { count: number; revenue: number }>,
    };

    stats.totalProfit = stats.totalRevenue - stats.totalCost;
    stats.averageOrderValue = stats.totalRevenue / stats.totalOrders;

    // Calculate category summary
    allSales.forEach((sale) => {
        if (!stats.categorySummary[sale.Category]) {
            stats.categorySummary[sale.Category] = { count: 0, revenue: 0 };
        }
        stats.categorySummary[sale.Category]!.count++;
        stats.categorySummary[sale.Category]!.revenue += sale.Revenue;
    });

    return stats;
}

main();
