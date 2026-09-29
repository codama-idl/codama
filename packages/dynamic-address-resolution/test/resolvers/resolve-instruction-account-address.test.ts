import {
    CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__CIRCULAR_ACCOUNT_DEPENDENCY,
    CODAMA_ERROR__DYNAMIC_CLIENT__DATA_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__NODE_REFERENCE_NOT_FOUND,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_NODE,
    CODAMA_ERROR__INJECTED_VALUE_NOT_PROVIDED,
    CodamaError,
} from '@codama/errors';
import type { Address } from '@solana/addresses';
import {
    accountBumpValueNode,
    accountDataValueNode,
    accountValueNode,
    bytesTypeNode,
    bytesValueNode,
    conditionalValueNode,
    dataValueNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumTypeNode,
    enumValueNode,
    enumVariantTypeNode,
    identityValueNode,
    injectedValueNode,
    instructionNode,
    integerTypeNode,
    integerValueNode,
    payerValueNode,
    programIdValueNode,
    programLinkNode,
    programNode,
    providedNode,
    publicKeyTypeNode,
    publicKeyValueNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
} from 'codama';
import { describe, expect, expectTypeOf, test } from 'vitest';

import { resolveInstructionAccountAddress, type ResolveInstructionAccountAddressInput } from '../../src';
import { account, generateAddress, getAccountPath, PROGRAM_ADDRESS } from '../test-utils';

const OTHER_ADDRESS = 'SysvarRent111111111111111111111111111111111' as Address;

/** Expect the promise to reject with a Codama error with exactly the given context. */
async function expectCodamaError(promise: Promise<unknown>, expected: CodamaError): Promise<void> {
    await expect(promise).rejects.toThrow(expect.objectContaining({ context: expected.context }));
}

describe('provided accounts', () => {
    test('it returns the provided address', async () => {
        const address = await generateAddress();
        const { path } = getAccountPath(account('myAccount', { defaultValue: programIdValueNode() }));
        expect(await resolveInstructionAccountAddress({ accountsInput: { myAccount: address }, path })).toBe(address);
    });

    test('it accepts PublicKey-like objects', async () => {
        const address = await generateAddress();
        const { path } = getAccountPath(account('myAccount'));
        const accountsInput = { myAccount: { toBase58: () => address } };
        expect(await resolveInstructionAccountAddress({ accountsInput, path })).toBe(address);
    });

    test('it throws when a required account without default value is missing', async () => {
        const { path } = getAccountPath(account('myAccount'));
        const error = new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING, {
            accountName: path[3].identifier,
            instructionName: path[2].identifier,
        });
        await expectCodamaError(resolveInstructionAccountAddress({ path }), error);
        await expectCodamaError(resolveInstructionAccountAddress({ accountsInput: { myAccount: null }, path }), error);
    });
});

describe('optional accounts', () => {
    test('it uses the programId strategy by default when null is provided', async () => {
        const { path } = getAccountPath(account('myAccount', { isOptional: true }));
        expect(await resolveInstructionAccountAddress({ accountsInput: { myAccount: null }, path })).toBe(
            PROGRAM_ADDRESS,
        );
    });

    test('it uses the omitted strategy when null is provided', async () => {
        const { path } = getAccountPath(account('myAccount', { isOptional: true }), {
            optionalAccountStrategy: 'omitted',
        });
        expect(await resolveInstructionAccountAddress({ accountsInput: { myAccount: null }, path })).toBeNull();
    });

    test('it uses the default value when undefined and the strategy when null', async () => {
        const defaultValue = publicKeyValueNode(OTHER_ADDRESS);
        const { path } = getAccountPath(account('myAccount', { defaultValue, isOptional: true }), {
            optionalAccountStrategy: 'omitted',
        });
        expect(await resolveInstructionAccountAddress({ path })).toBe(OTHER_ADDRESS);
        expect(await resolveInstructionAccountAddress({ accountsInput: { myAccount: null }, path })).toBeNull();
    });
});

describe('default values', () => {
    test('it resolves public keys and program IDs', async () => {
        const publicKey = getAccountPath(account('a', { defaultValue: publicKeyValueNode(OTHER_ADDRESS) })).path;
        const programId = getAccountPath(account('a', { defaultValue: programIdValueNode() })).path;
        expect(await resolveInstructionAccountAddress({ path: publicKey })).toBe(OTHER_ADDRESS);
        expect(await resolveInstructionAccountAddress({ path: programId })).toBe(PROGRAM_ADDRESS);
    });

    test('it resolves program links to the address of the linked program', async () => {
        // Given an account defaulting to another program of the root.
        const target = account('tokenProgram', { defaultValue: programLinkNode('token') });
        const { instruction, root: base } = getAccountPath(target);
        const root = rootNode(base.program, {
            additionalPrograms: [programNode({ identifier: 'token', publicKey: OTHER_ADDRESS })],
        });

        // Then it resolves to the address of that program.
        const path = [root, root.program, instruction, target] as const;
        expect(await resolveInstructionAccountAddress({ path })).toBe(OTHER_ADDRESS);
    });

    test('it resolves account values, recursively', async () => {
        const address = await generateAddress();
        const target = account('target', { defaultValue: accountValueNode('middle') });
        const { path } = getAccountPath(target, {
            accounts: [account('middle', { defaultValue: accountValueNode('source') }), account('source')],
        });
        expect(await resolveInstructionAccountAddress({ accountsInput: { source: address }, path })).toBe(address);
    });

    test('it throws when an account value refers to an unknown account', async () => {
        const { path } = getAccountPath(account('target', { defaultValue: accountValueNode('unknown') }));
        await expectCodamaError(
            resolveInstructionAccountAddress({ path }),
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__NODE_REFERENCE_NOT_FOUND, {
                instructionName: path[2].identifier,
                referencedName: accountValueNode('unknown').identifier,
            }),
        );
    });

    test('it throws on circular account dependencies', async () => {
        const target = account('a', { defaultValue: accountValueNode('b') });
        const { path } = getAccountPath(target, { accounts: [account('b', { defaultValue: accountValueNode('a') })] });
        await expectCodamaError(
            resolveInstructionAccountAddress({ path }),
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__CIRCULAR_ACCOUNT_DEPENDENCY, { chain: 'b -> a -> b' }),
        );
    });

    test('it resolves data values, including nested ones', async () => {
        const address = await generateAddress();
        const data = structTypeNode([
            structFieldTypeNode({
                identifier: 'config',
                type: structTypeNode([structFieldTypeNode({ identifier: 'owner', type: publicKeyTypeNode() })]),
            }),
        ]);
        const { path } = getAccountPath(account('owner', { defaultValue: dataValueNode('config.owner') }), { data });
        expect(await resolveInstructionAccountAddress({ dataInput: { config: { owner: address } }, path })).toBe(
            address,
        );
    });

    test('it throws when a data value is missing or not an address', async () => {
        const data = structTypeNode([structFieldTypeNode({ identifier: 'owner', type: publicKeyTypeNode() })]);
        const { path } = getAccountPath(account('owner', { defaultValue: dataValueNode('owner') }), { data });
        await expectCodamaError(
            resolveInstructionAccountAddress({ dataInput: {}, path }),
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__DATA_MISSING, {
                instructionName: path[2].identifier,
                path: dataValueNode('owner').path,
            }),
        );
        await expectCodamaError(
            resolveInstructionAccountAddress({ dataInput: { owner: 42 }, path }),
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE, {
                accountName: path[3].identifier,
                actualType: 'number',
                expectedType: 'Address | PublicKey',
            }),
        );
    });

    test('it requires the payer and identity to be provided', async () => {
        const address = await generateAddress();
        for (const defaultValue of [payerValueNode(), identityValueNode()]) {
            const { path } = getAccountPath(account('payer', { defaultValue }));
            expect(await resolveInstructionAccountAddress({ accountsInput: { payer: address }, path })).toBe(address);
            await expect(resolveInstructionAccountAddress({ path })).rejects.toThrow(
                expect.objectContaining({
                    context: expect.objectContaining({ __code: CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING }),
                }),
            );
        }
    });

    test('it does not support account bumps and account data', async () => {
        const bump = getAccountPath(account('a', { defaultValue: accountBumpValueNode('pda') })).path;
        const data = getAccountPath(
            account('a', { defaultValue: accountDataValueNode('mint', { path: 'owner' }) }),
        ).path;
        await expectCodamaError(
            resolveInstructionAccountAddress({ path: bump }),
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_NODE, { nodeKind: 'accountBumpValueNode' }),
        );
        await expectCodamaError(
            resolveInstructionAccountAddress({ path: data }),
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_NODE, { nodeKind: 'accountDataValueNode' }),
        );
    });
});

describe('injected values', () => {
    test('it resolves injected values provided by the instruction and its parents', async () => {
        // Given a sub-instruction account defaulting to a value provided by its parent.
        const target = account('pool', { defaultValue: injectedValueNode({ key: 'pool' }) });
        const child = instructionNode({ accounts: [target], identifier: 'child' });
        const parent = instructionNode({
            identifier: 'parent',
            provides: [providedNode('pool', publicKeyValueNode(OTHER_ADDRESS))],
            subInstructions: [child],
        });
        const root = rootNode(programNode({ identifier: 'p', instructions: [parent], publicKey: PROGRAM_ADDRESS }));

        // Then it resolves from the provided value.
        const path = [root, root.program, parent, child, target] as const;
        expect(await resolveInstructionAccountAddress({ path })).toBe(OTHER_ADDRESS);
    });

    test('it throws when the injected value is not provided', async () => {
        const injected = injectedValueNode({ key: 'pool' });
        const { path } = getAccountPath(account('pool', { defaultValue: injected }));
        await expectCodamaError(
            resolveInstructionAccountAddress({ path }),
            new CodamaError(CODAMA_ERROR__INJECTED_VALUE_NOT_PROVIDED, { injectedValue: injected, key: injected.key }),
        );
    });
});

describe('conditional values', () => {
    const ifTrue = publicKeyValueNode(OTHER_ADDRESS);
    const ifFalse = programIdValueNode();
    const modeData = structTypeNode([structFieldTypeNode({ identifier: 'mode', type: integerTypeNode('u8') })]);

    test('it compares integers regardless of their JavaScript type', async () => {
        const defaultValue = conditionalValueNode({
            condition: dataValueNode('mode'),
            ifFalse,
            ifTrue,
            value: integerValueNode('2'),
        });
        const { path } = getAccountPath(account('a', { defaultValue }), { data: modeData });
        expect(await resolveInstructionAccountAddress({ dataInput: { mode: 2 }, path })).toBe(OTHER_ADDRESS);
        expect(await resolveInstructionAccountAddress({ dataInput: { mode: 2n }, path })).toBe(OTHER_ADDRESS);
        expect(await resolveInstructionAccountAddress({ dataInput: { mode: 3 }, path })).toBe(PROGRAM_ADDRESS);
    });

    test('it compares enum values', async () => {
        // Given an account whose default depends on an enum field linking to a program enum.
        const mode = definedTypeNode({
            identifier: 'mode',
            type: enumTypeNode([enumVariantTypeNode('fast'), enumVariantTypeNode('slow')]),
        });
        const data = structTypeNode([structFieldTypeNode({ identifier: 'mode', type: definedTypeLinkNode('mode') })]);
        const defaultValue = conditionalValueNode({
            condition: dataValueNode('mode'),
            ifFalse,
            ifTrue,
            value: enumValueNode('mode', 'slow'),
        });
        const { path } = getAccountPath(account('a', { defaultValue }), { data }, { definedTypes: [mode] });

        // Then variants compare by identifier, whether given as a string or an object.
        expect(await resolveInstructionAccountAddress({ dataInput: { mode: 'slow' }, path })).toBe(OTHER_ADDRESS);
        expect(await resolveInstructionAccountAddress({ dataInput: { mode: { __kind: 'slow' } }, path })).toBe(
            OTHER_ADDRESS,
        );
        expect(await resolveInstructionAccountAddress({ dataInput: { mode: 'fast' }, path })).toBe(PROGRAM_ADDRESS);
    });

    test('it checks whether the condition exists without a value', async () => {
        const address = await generateAddress();
        const defaultValue = conditionalValueNode({ condition: accountValueNode('source'), ifFalse, ifTrue });
        const { path } = getAccountPath(account('a', { defaultValue }), {
            accounts: [account('source', { isOptional: true })],
        });
        expect(await resolveInstructionAccountAddress({ accountsInput: { source: address }, path })).toBe(
            OTHER_ADDRESS,
        );
        expect(await resolveInstructionAccountAddress({ accountsInput: { source: null }, path })).toBe(PROGRAM_ADDRESS);
    });

    test('it takes the ifFalse branch for accounts that are not provided and have no default value', async () => {
        const defaultValue = conditionalValueNode({ condition: accountValueNode('source'), ifFalse, ifTrue });
        const { path } = getAccountPath(account('a', { defaultValue }), { accounts: [account('source')] });
        expect(await resolveInstructionAccountAddress({ accountsInput: {}, path })).toBe(PROGRAM_ADDRESS);
    });

    test('it compares bytes regardless of their representation', async () => {
        const data = structTypeNode([structFieldTypeNode({ identifier: 'tag', type: bytesTypeNode() })]);
        const defaultValue = conditionalValueNode({
            condition: dataValueNode('tag'),
            ifFalse,
            ifTrue,
            value: bytesValueNode('base16', '0102'),
        });
        const { path } = getAccountPath(account('a', { defaultValue }), { data });
        expect(await resolveInstructionAccountAddress({ dataInput: { tag: new Uint8Array([1, 2]) }, path })).toBe(
            OTHER_ADDRESS,
        );
        expect(await resolveInstructionAccountAddress({ dataInput: { tag: ['base64', 'AQI='] }, path })).toBe(
            OTHER_ADDRESS,
        );
        expect(await resolveInstructionAccountAddress({ dataInput: { tag: new Uint8Array([1, 3]) }, path })).toBe(
            PROGRAM_ADDRESS,
        );
    });

    test('it uses the optional account strategy when no branch matches', async () => {
        const defaultValue = conditionalValueNode({
            condition: dataValueNode('mode'),
            ifTrue,
            value: integerValueNode('2'),
        });
        const optional = getAccountPath(account('a', { defaultValue, isOptional: true }), {
            data: modeData,
            optionalAccountStrategy: 'omitted',
        }).path;
        const required = getAccountPath(account('a', { defaultValue }), { data: modeData }).path;
        expect(await resolveInstructionAccountAddress({ dataInput: { mode: 3 }, path: optional })).toBeNull();
        await expectCodamaError(
            resolveInstructionAccountAddress({ dataInput: { mode: 3 }, path: required }),
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING, {
                accountName: required[3].identifier,
                instructionName: required[2].identifier,
            }),
        );
    });
});

describe('types', () => {
    test('it narrows the account and data inputs', () => {
        type Accounts = { authority: Address };
        type Data = { amount: bigint };
        type Input = ResolveInstructionAccountAddressInput<Accounts, Data>;
        expectTypeOf<Input['accountsInput']>().toEqualTypeOf<Accounts | undefined>();
        expectTypeOf<Input['dataInput']>().toEqualTypeOf<Data | undefined>();
        expectTypeOf(resolveInstructionAccountAddress).returns.toEqualTypeOf<Promise<Address | null>>();
    });
});
