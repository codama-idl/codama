import type { Address } from '@solana/addresses';
import type { Instruction } from '@solana/instructions';
import type { InstructionNode, NodePath } from 'codama';
import { describe, expectTypeOf, test } from 'vitest';

import { type AccountsInput, createInstructionsBuilder, type FetchAccountsFn } from '../../src';
import type { EitherSigners, InstructionInput, InstructionsBuilderFn } from '../../src/shared/types';

declare const path: NodePath<InstructionNode>;

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

// Type-level checks only: these functions are never called.
describe('createInstructionsBuilder', () => {
    const fetchAccounts = (() => Promise.resolve([])) as FetchAccountsFn;

    test('it accepts an optional fetchAccounts option by default', () => {
        expectTypeOf(() => createInstructionsBuilder(path)).toBeFunction();
        expectTypeOf(() => createInstructionsBuilder(path, { fetchAccounts })).toBeFunction();
    });

    test('it requires a fetchAccounts option for instructions reading account data', () => {
        const create = createInstructionsBuilder<undefined, AccountsInput, string[], true>;
        expectTypeOf(() => create(path, { fetchAccounts })).toBeFunction();
        // @ts-expect-error A fetchAccounts option is required.
        expectTypeOf(() => create(path)).toBeFunction();
        // @ts-expect-error A fetchAccounts option is required.
        expectTypeOf(() => create(path, {})).toBeFunction();
    });

    test('it keeps the fetchAccounts option optional for instructions not reading account data', () => {
        const create = createInstructionsBuilder<undefined, AccountsInput, string[], false>;
        expectTypeOf(() => create(path)).toBeFunction();
        expectTypeOf(() => create(path, {})).toBeFunction();
    });
});

describe('EitherSigners', () => {
    test('it is an array of strings', () => {
        expectTypeOf<EitherSigners>().toEqualTypeOf<string[]>();
    });
});
