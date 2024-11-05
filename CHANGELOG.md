# example

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
