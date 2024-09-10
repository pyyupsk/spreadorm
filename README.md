# 🗄️ SpreadORM - Google Sheets ORM

![Version](https://img.shields.io/npm/v/spreadorm)
![License](https://img.shields.io/npm/l/spreadorm)
![Downloads](https://img.shields.io/npm/dm/spreadorm)

Welcome to **SpreadORM**! 🎉 A lightweight **Object-Relational Mapper (ORM)** designed to interface with **Google Sheets** as if they were databases. This tool provides a simple yet powerful way to query, and manage filter in your Google Sheets using **TypeScript**. Perfect for developers who want an easy ORM for non-relational data.

## 🚀 Key Features

-   **Simple Integration** with Google Sheets via sheet ID
-   **Flexible Queries**: Support for filtering, selecting, ordering, and limiting
-   **Find Methods**: Fetch data by unique, first, last, or multiple rows
-   **Caching**: Built-in caching for efficient data access
-   **TypeScript Support**: Enforce strong typing with generics

## 🛠️ Installation

To use **SpreadORM**, install it via npm:

```bash
npm install spreadorm
```

## 🌟 Usage

Here’s how you can use SpreadORM to interact with your Google Sheets.

### Initialize SpreadORM

First, initialize the ORM with your **Google Sheet ID**:

```typescript
import { SpreadORM } from 'spreadorm';

const sheetId = 'your-google-sheet-id';
const orm = new SpreadORM<MyDataType>(sheetId);
```

### Querying Data

**Find multiple rows** based on certain conditions:

```typescript
const users = await orm.findMany({
    where: { role: 'admin' },
    orderBy: { key: 'createdAt', order: 'asc' },
    limit: 10,
});
```

**Find a unique row**:

```typescript
const user = await orm.findUnique({
    where: { id: '123' },
});
```

**Count rows**:

```typescript
const totalUsers = await orm.count({
    where: { active: true },
});
```

### Reset Cache

To reset the internal cache and force a fresh data fetch:

```typescript
await orm.reset();
```

## 📊 Data Structure

SpreadORM supports flexible data models, and you can customize it to fit any Google Sheet structure. Simply define your data structure using **TypeScript interfaces**.

```typescript
interface User {
    id: string;
    name: string;
    role: string;
    createdAt: string;
    active: boolean;
}
```

## 📄 Methods Overview

Here’s an overview of the primary methods available in SpreadORM:

### `findMany(options?: SheetOptions<T>)`

-   Fetch multiple rows based on query options.
-   Supports filtering (`where`), ordering, pagination (`limit`, `offset`), and selecting specific columns.

### `findUnique(options?: SheetOptions<T>)`

-   Retrieve a single unique row.
-   Throws an error if multiple results are found.

### `findFirst(options?: SheetOptions<T>)`

-   Get the first row that matches the query options.

### `findLast(options?: SheetOptions<T>)`

-   Fetch the last row that matches the query options.

### `count(options?: SheetOptions<T>)`

-   Count the number of rows that match the query options.

### `reset()`

-   Reset the internal cache.

## 🤝 Contributing

We welcome contributions! Whether it's a bug fix, feature suggestion, or enhancement, feel free to submit a pull request. Please read our [Contributing Guidelines](CONTRIBUTING.md) to get started.

## 📝 License

SpreadORM is licensed under the **MIT License**. For more details, see the [LICENSE](LICENSE) file.

## 🙋‍♂️ Contact

Have questions or suggestions? Feel free to open an issue or contact us:

📧 [pyyupsk@proton.me](mailto:pyyupsk@proton.me)

---

Happy Coding! 😃
