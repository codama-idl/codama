import { CodamaError } from '@codama/errors';
import type { Address } from '@solana/addresses';
import { address } from '@solana/addresses';
import { instructionAccountNode, instructionNode, programIdValueNode, programNode, rootNode } from 'codama';
import { describe, expect, expectTypeOf, test } from 'vitest';

import type { ResolverFn } from '../../src';
import type { ResolveInstructionAccountAddressInput } from '../../src/resolvers';
import { resolveInstructionAccountAddress } from '../../src/resolvers';
import { generateAddress } from '../test-utils';

const PROGRAM_PUBLIC_KEY = '11111111111111111111111111111111';
const programAddress = address(PROGRAM_PUBLIC_KEY);
const root = rootNode(programNode({ name: 'test', publicKey: PROGRAM_PUBLIC_KEY }));

describe('resolveInstructionAccountAddress', () => {
    const ixNode = instructionNode({ name: 'testInstruction' });

    const requiredAccountNode = instructionAccountNode({
        isOptional: false,
        isSigner: false,
        isWritable: false,
        name: 'myAccount',
    });

    const optionalAccountNode = instructionAccountNode({
        isOptional: true,
        isSigner: false,
        isWritable: false,
        name: 'myAccount',
    });

    const requiredAccountWithDefaultNode = instructionAccountNode({
        defaultValue: programIdValueNode(),
        isOptional: false,
        isSigner: false,
        isWritable: false,
        name: 'myAccount',
    });

    const optionalAccountWithDefaultNode = instructionAccountNode({
        defaultValue: programIdValueNode(),
        isOptional: true,
        isSigner: false,
        isWritable: false,
        name: 'myAccount',
    });

    test('should return the address when accountsInput contains an Address', async () => {
        const addr = await generateAddress();
        const result = await resolveInstructionAccountAddress({
            accountsInput: { myAccount: addr },
            ixAccountNode: requiredAccountNode,
            ixNode,
            root,
        });
        expect(result).toBe(addr);
    });

    test('should return the address when accountsInput contains a PublicKey-like object', async () => {
        const addr = await generateAddress();
        const publicKeyLike = { toBase58: () => addr };
        const result = await resolveInstructionAccountAddress({
            accountsInput: { myAccount: publicKeyLike },
            ixAccountNode: requiredAccountNode,
            ixNode,
            root,
        });
        expect(result).toBe(addr);
    });

    test('should return resolved address from defaultValue when account not in input', async () => {
        const result = await resolveInstructionAccountAddress({
            accountsInput: {},
            ixAccountNode: requiredAccountWithDefaultNode,
            ixNode,
            root,
        });
        expect(result).toBe(programAddress);
    });

    test('should throw ACCOUNT_MISSING when key is absent', async () => {
        const ixNodeOmitted = instructionNode({ name: 'testInstruction', optionalAccountStrategy: 'omitted' });
        await expect(
            resolveInstructionAccountAddress({
                accountsInput: {},
                ixAccountNode: optionalAccountNode,
                ixNode: ixNodeOmitted,
                root,
            }),
        ).rejects.toThrow(/Missing account \[myAccount\] in \[testInstruction\] instruction/);
    });

    test('should throw ACCOUNT_MISSING error for required account with no default', async () => {
        await expect(
            resolveInstructionAccountAddress({
                accountsInput: {},
                ixAccountNode: requiredAccountNode,
                ixNode,
                root,
            }),
        ).rejects.toThrow(CodamaError);
    });

    test('should return program address when null input for optional account with programId strategy is provided', async () => {
        const ixNodeProgramId = instructionNode({
            name: 'testInstruction',
            optionalAccountStrategy: 'programId',
        });
        const result = await resolveInstructionAccountAddress({
            accountsInput: { myAccount: null },
            ixAccountNode: optionalAccountNode,
            ixNode: ixNodeProgramId,
            root,
        });
        expect(result).toBe(programAddress);
    });

    test('should return null when null input for optional account with omitted strategy is provided', async () => {
        const ixNodeOmitted = instructionNode({ name: 'testInstruction', optionalAccountStrategy: 'omitted' });
        const result = await resolveInstructionAccountAddress({
            accountsInput: { myAccount: null },
            ixAccountNode: optionalAccountNode,
            ixNode: ixNodeOmitted,
            root,
        });
        expect(result).toBeNull();
    });

    test('should throw ACCOUNT_MISSING error for required account with no default when null is provided', async () => {
        await expect(
            resolveInstructionAccountAddress({
                accountsInput: { myAccount: null },
                ixAccountNode: requiredAccountNode,
                ixNode,
                root,
            }),
        ).rejects.toThrow(CodamaError);
    });

    test('should resolve from defaultValue for required account when null is provided', async () => {
        const result = await resolveInstructionAccountAddress({
            accountsInput: { myAccount: null },
            ixAccountNode: requiredAccountWithDefaultNode,
            ixNode,
            root,
        });
        expect(result).toBe(programAddress);
    });

    test('should resolve from defaultValue for optional account when input is omitted', async () => {
        const result = await resolveInstructionAccountAddress({
            accountsInput: {},
            ixAccountNode: optionalAccountWithDefaultNode,
            ixNode,
            root,
        });
        expect(result).toBe(programAddress);
    });

    test('should resolve via programId strategy for optional account with default when null is provided', async () => {
        const ixNodeProgramId = instructionNode({
            name: 'testInstruction',
            optionalAccountStrategy: 'programId',
        });
        const result = await resolveInstructionAccountAddress({
            accountsInput: { myAccount: null },
            ixAccountNode: optionalAccountWithDefaultNode,
            ixNode: ixNodeProgramId,
            root,
        });
        expect(result).toBe(programAddress);
    });

    test('should resolve via omitted strategy for optional account with default when null is provided', async () => {
        const ixNodeOmitted = instructionNode({ name: 'testInstruction', optionalAccountStrategy: 'omitted' });
        const result = await resolveInstructionAccountAddress({
            accountsInput: { myAccount: null },
            ixAccountNode: optionalAccountWithDefaultNode,
            ixNode: ixNodeOmitted,
            root,
        });
        expect(result).toBeNull();
    });
});

describe('resolveInstructionAccountAddress generics', () => {
    type GeneratedAccounts = { authority: Address; mint?: Address | null };
    type GeneratedArgs = { name: string };
    type ResolversFn = {
        resolveTags: ResolverFn<GeneratedArgs, GeneratedAccounts>;
    };
    test('should return Promise<Address | null> regardless of generics', () => {
        expectTypeOf(resolveInstructionAccountAddress).returns.toEqualTypeOf<Promise<Address | null>>();
    });

    test('default-parameter input matches the loose ResolveInstructionAccountAddressInput', () => {
        expectTypeOf<ResolveInstructionAccountAddressInput>().toExtend<
            Parameters<typeof resolveInstructionAccountAddress>[0]
        >();
    });

    test('narrows accountsInput / argumentsInput / resolversInput to provided generic types', () => {
        type NarrowedInput = ResolveInstructionAccountAddressInput<GeneratedAccounts, GeneratedArgs, ResolversFn>;
        expectTypeOf<NarrowedInput['accountsInput']>().toEqualTypeOf<GeneratedAccounts | undefined>();
        expectTypeOf<NarrowedInput['argumentsInput']>().toEqualTypeOf<GeneratedArgs | undefined>();
        expectTypeOf<NarrowedInput['resolversInput']>().toEqualTypeOf<ResolversFn | undefined>();
    });

    test('resolver callbacks see narrowed args/accounts via TResolvers', () => {
        type NarrowedResolvers = NonNullable<
            ResolveInstructionAccountAddressInput<GeneratedAccounts, GeneratedArgs, ResolversFn>['resolversInput']
        >;
        expectTypeOf<NarrowedResolvers['resolveTags']>().parameters.toEqualTypeOf<[GeneratedArgs, GeneratedAccounts]>();
    });
});
