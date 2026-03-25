export class DynamicInstructionsError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'DynamicInstructionsError';
    }
}

export class ValidationError extends DynamicInstructionsError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'ValidationError';
    }
}

export class AccountError extends DynamicInstructionsError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'AccountError';
    }
}

export class ArgumentError extends DynamicInstructionsError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'ArgumentError';
    }
}

export class ResolverError extends DynamicInstructionsError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'ResolverError';
    }
}
