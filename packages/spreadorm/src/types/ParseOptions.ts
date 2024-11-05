export type ParseOptions = {
    skipEmptyLines?: boolean;
    transformHeader?: (header: string) => string;
    delimiter?: string;
};
