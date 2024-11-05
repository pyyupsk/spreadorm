export class SpreadORMError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SpreadORMError';
    }
}

export class FetchError extends SpreadORMError {
    constructor(
        message: string,
        public statusCode?: number,
    ) {
        super(`Failed to fetch spreadsheet: ${message}`);
        this.name = 'FetchError';
    }
}

export class ValidationError extends SpreadORMError {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}
