import { describe, expect, expectTypeOf, test } from 'vitest';

import {
    AccountError,
    ArgumentError,
    DynamicInstructionsError,
    ResolverError,
    ValidationError,
} from '../../../src/shared/errors';

describe('DynamicInstructionsError', () => {
    test('should set name and message', () => {
        const error = new DynamicInstructionsError('test message');
        expect(error.name).toBe('DynamicInstructionsError');
        expect(error.message).toBe('test message');
    });

    test('should be an instance of Error', () => {
        const error = new DynamicInstructionsError('test');
        expect(error).toBeInstanceOf(Error);
        expectTypeOf(error).toExtend<Error>();
    });
});

describe('ValidationError', () => {
    test('should set name and message', () => {
        const error = new ValidationError('validation failed');
        expect(error.name).toBe('ValidationError');
        expect(error.message).toBe('validation failed');
    });

    test('should be an instance of DynamicInstructionsError', () => {
        expect(new ValidationError('test')).toBeInstanceOf(DynamicInstructionsError);
    });

    test('should be an instance of Error', () => {
        expect(new ValidationError('test')).toBeInstanceOf(Error);
    });
});

describe('AccountError', () => {
    test('should set name and message', () => {
        const error = new AccountError('account issue');
        expect(error.name).toBe('AccountError');
        expect(error.message).toBe('account issue');
    });

    test('should be an instance of DynamicInstructionsError', () => {
        expect(new AccountError('test')).toBeInstanceOf(DynamicInstructionsError);
    });
});

describe('ArgumentError', () => {
    test('should set name and message', () => {
        const error = new ArgumentError('arg issue');
        expect(error.name).toBe('ArgumentError');
        expect(error.message).toBe('arg issue');
    });

    test('should be an instance of DynamicInstructionsError', () => {
        expect(new ArgumentError('test')).toBeInstanceOf(DynamicInstructionsError);
    });
});

describe('ResolverError', () => {
    test('should set name and message', () => {
        const error = new ResolverError('resolver issue');
        expect(error.name).toBe('ResolverError');
        expect(error.message).toBe('resolver issue');
    });

    test('should be an instance of DynamicInstructionsError', () => {
        expect(new ResolverError('test')).toBeInstanceOf(DynamicInstructionsError);
    });
});

describe('error hierarchy types', () => {
    test('should have all errors extend DynamicInstructionsError', () => {
        expectTypeOf<ValidationError>().toExtend<DynamicInstructionsError>();
        expectTypeOf<AccountError>().toExtend<DynamicInstructionsError>();
        expectTypeOf<ArgumentError>().toExtend<DynamicInstructionsError>();
        expectTypeOf<ResolverError>().toExtend<DynamicInstructionsError>();
    });
});
