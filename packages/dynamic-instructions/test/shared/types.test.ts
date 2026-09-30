import type { Address } from '@solana/addresses';
import type { Instruction } from '@solana/instructions';
import { describe, expectTypeOf, test } from 'vitest';

import type { EitherSigners, InstructionInput, InstructionsBuilderFn } from '../../src/shared/types';

describe('InstructionsBuilderFn', () => {
    test('it returns a Promise of Instruction', () => {
        expectTypeOf<InstructionsBuilderFn>().returns.toEqualTypeOf<Promise<Instruction>>();
    });

    test('it can be called without inputs', () => {
        expectTypeOf<InstructionsBuilderFn>().toBeCallableWith();
    });

    test('it accepts accounts, data and signers', () => {
        expectTypeOf<InstructionsBuilderFn>().toBeCallableWith({ accounts: {}, data: {}, signers: [] });
    });

    test('it types its inputs with its type parameters', () => {
        type Build = InstructionsBuilderFn<{ amount: bigint }, { signers: Address[]; source: Address }, 'owner'[]>;
        expectTypeOf<Parameters<Build>[0]>().toEqualTypeOf<
            InstructionInput<{ amount: bigint }, { signers: Address[]; source: Address }, 'owner'[]> | undefined
        >();
        expectTypeOf<NonNullable<Parameters<Build>[0]>['data']>().toEqualTypeOf<{ amount: bigint } | undefined>();
    });
});

describe('EitherSigners', () => {
    test('it is an array of strings', () => {
        expectTypeOf<EitherSigners>().toEqualTypeOf<string[]>();
    });
});
