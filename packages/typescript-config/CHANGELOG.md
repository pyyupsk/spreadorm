# @repo/typescript-config

## 2.1.0

### Dependencies

- Updated dependencies to latest versions:
  - papaparse: ^5.5.3
  - @types/node: ^22.15.21
  - @types/papaparse: ^5.3.16
  - eslint: ^9.27.0
  - tsup: ^8.5.0
  - typescript: ^5.8.3

### Improvements

- Enhanced type safety with readonly modifiers
- Improved error handling with nullish coalescing
- Refactored where clause handling for better maintainability
- Optimized comparison functions for better performance
- Added stricter validation for cache duration (must be positive)

### Fixes

- Fixed potential type issues in where clause operators
- Improved handling of null/undefined values in comparisons
- Enhanced error message handling in fetch operations

## 2.0.0

### Major Changes

- **Constructor Updates**:
  - Changed constructor signature for more flexible configuration.
  - Introduced a new options object parameter that includes caching and parsing configurations.
- **Error Handling**:
  - Added custom error classes: `SpreadORMError`, `FetchError`, and `ValidationError`.
  - Enhanced error messages and handling throughout the library.
  - Included status code support for fetch errors.
- **Caching Enhancements**:
  - Introduced new cache configuration options.
  - Added methods: `getCacheStatus` for monitoring cache and `configureCaching` for runtime cache configuration.
  - Improved cache validation logic.
- **CSV Parsing Improvements**:
  - Enhanced CSV parsing with configurable options.
  - Implemented empty column removal and improved handling of empty rows and whitespace.
  - Added support for header transformations.
- **Query Enhancements**:
  - Extended `WhereClause` operators with new string operations: `contains`, `startsWith`, `endsWith`.
  - Added array operations: `in`, `notIn`.
  - Enhanced `OrderBy` to support multiple sorting criteria.
- **TypeScript Support**:

  - Improved type safety for constructor parameters and query operations.
  - Enhanced type definitions and added new interfaces for configuration options.

### Fixes

- Fixed issues with handling empty rows.
- Improved handling of null values in sorting operations.
- Enhanced error handling for CSV parsing errors.
- Fixed edge cases in cache validation logic.

### Breaking Changes

- **Constructor Signature Change**: The constructor's signature has changed to support a new options object parameter, which may require updates to existing instantiation calls.

## 1.0.1

### Initial

- Initial release of spreadorm
- Added core functionality for spreadsheet operations
- Integrated papaparse for CSV parsing
- Set up ESM and CommonJS module support
- Configured TypeScript compilation and type declarations
