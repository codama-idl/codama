export class CliError extends Error {
    constructor(
        message: string,
        public items: string[] = [],
        options?: ErrorOptions,
    ) {
        super(message, options);
        this.name = 'CliError';
    }
}
