export class ConfigurationError {
    public readonly _tag = 'ConfigurationError';

    constructor(
        public readonly message: string,
        public readonly cause?: unknown,
    ) { }
}
