import type { Address } from '@solana/addresses';
import type { Instruction } from '@solana/instructions';
import { describe, expectTypeOf, test } from 'vitest';

import type { AddressInput } from '../../../src/shared/address';
import type {
    AccountsInput,
    ArgumentsInput,
    BuildIxFn,
    EitherSigners,
    ResolverFn,
    ResolversInput,
} from '../../../src/shared/types';

describe('AccountsInput', () => {
    test('should accept partial record of string to AddressInput | null', () => {
        expectTypeOf<AccountsInput>().toExtend<Partial<Record<string, AddressInput | null>>>();
    });

    test('should allow null values for optional accounts', () => {
        expectTypeOf<{ mint: null }>().toExtend<AccountsInput>();
    });

    test('should allow AddressInput values', () => {
        expectTypeOf<{ mint: Address }>().toExtend<AccountsInput>();
    });

    test('should allow partial (missing keys)', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        expectTypeOf<{}>().toExtend<AccountsInput>();
    });
});

describe('ArgumentsInput', () => {
    test('should accept partial record of string to unknown', () => {
        expectTypeOf<ArgumentsInput>().toExtend<Partial<Record<string, unknown>>>();
    });

    test('should allow any value types', () => {
        expectTypeOf<{ amount: bigint; name: string }>().toExtend<ArgumentsInput>();
    });
});

describe('EitherSigners', () => {
    test('should be an array of strings', () => {
        expectTypeOf<EitherSigners>().toEqualTypeOf<string[]>();
    });
});

describe('ResolverFn', () => {
    test('should accept arguments and accounts input and return Promise<unknown>', () => {
        expectTypeOf<ResolverFn>().toBeFunction();
        expectTypeOf<ResolverFn>().parameters.toEqualTypeOf<[ArgumentsInput, AccountsInput]>();
        expectTypeOf<ResolverFn>().returns.toEqualTypeOf<Promise<unknown>>();
    });
});

describe('ResolversInput', () => {
    test('should be a record of string to ResolverFn', () => {
        expectTypeOf<ResolversInput>().toEqualTypeOf<Record<string, ResolverFn>>();
    });
});

describe('BuildIxFn', () => {
    test('should return a Promise of Instruction', () => {
        expectTypeOf<BuildIxFn>().returns.toEqualTypeOf<Promise<Instruction>>();
    });

    test('should allow calling with no arguments', () => {
        expectTypeOf<BuildIxFn>().toBeCallableWith();
    });

    test('should accept all four parameters', () => {
        expectTypeOf<BuildIxFn>().toBeCallableWith({}, {}, [], {});
    });
});
