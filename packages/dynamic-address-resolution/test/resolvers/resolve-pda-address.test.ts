import {
    CODAMA_ERROR__CANNOT_RESOLVE_PATH,
    CODAMA_ERROR__DYNAMIC_CLIENT__DATA_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__NODE_REFERENCE_NOT_FOUND,
    CODAMA_ERROR__DYNAMIC_CLIENT__PDA_SEED_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE,
    CodamaError,
} from '@codama/errors';
import { type Address, getAddressEncoder, getProgramDerivedAddress } from '@solana/addresses';
import { getU16Encoder, getU64Encoder, getUtf8Encoder, type ReadonlyUint8Array } from '@solana/codecs';
import {
    accountValueNode,
    constantPdaSeedNode,
    dataValueNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumTypeNode,
    enumValueNode,
    enumVariantTypeNode,
    injectedValueNode,
    instructionNode,
    integerTypeNode,
    integerValueNode,
    optionTypeNode,
    pathString,
    pdaLinkNode,
    pdaNode,
    pdaSeedValueNode,
    pdaValueNode,
    programIdValueNode,
    programLinkNode,
    programNode,
    providedNode,
    publicKeyTypeNode,
    publicKeyValueNode,
    remainderOptionTypeNode,
    rootNode,
    sizePrefixTransformNode,
    stringTypeNode,
    stringValueNode,
    structFieldTypeNode,
    structFieldValueNode,
    structTypeNode,
    structValueNode,
    variablePdaSeedNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { resolveInstructionAccountAddress } from '../../src';
import { account, generateAddress, getAccountPath, PROGRAM_ADDRESS } from '../test-utils';

const OTHER_PROGRAM = 'SysvarRent111111111111111111111111111111111' as Address;
const utf8 = (value: string) => getUtf8Encoder().encode(value);
const pubkey = (value: Address) => getAddressEncoder().encode(value);

async function derive(seeds: readonly ReadonlyUint8Array[], programAddress: Address = PROGRAM_ADDRESS) {
    return (await getProgramDerivedAddress({ programAddress, seeds: [...seeds] }))[0];
}

async function expectCodamaError(promise: Promise<unknown>, expected: CodamaError): Promise<void> {
    await expect(promise).rejects.toThrow(expect.objectContaining({ context: expected.context }));
}

describe('constant seeds', () => {
    test('it encodes constant seeds using their type', async () => {
        const pda = pdaNode({
            identifier: 'vault',
            seeds: [
                constantPdaSeedNode(stringTypeNode('utf8'), stringValueNode('vault')),
                constantPdaSeedNode(publicKeyTypeNode(), programIdValueNode()),
                constantPdaSeedNode(integerTypeNode('u16'), integerValueNode('300')),
            ],
        });
        const { path } = getAccountPath(
            account('vault', { defaultValue: pdaValueNode(pdaLinkNode('vault')) }),
            {},
            {
                pdas: [pda],
            },
        );
        const expected = await derive([utf8('vault'), pubkey(PROGRAM_ADDRESS), getU16Encoder().encode(300)]);
        expect(await resolveInstructionAccountAddress({ path })).toBe(expected);
    });

    test('it encodes enum seeds using the linked enum of their program', async () => {
        const kind = definedTypeNode({
            identifier: 'kind',
            type: enumTypeNode([enumVariantTypeNode('a'), enumVariantTypeNode('b')]),
        });
        const pda = pdaNode({
            identifier: 'vault',
            seeds: [constantPdaSeedNode(definedTypeLinkNode('kind'), enumValueNode('kind', 'b'))],
        });
        const { path } = getAccountPath(
            account('vault', { defaultValue: pdaValueNode(pdaLinkNode('vault')) }),
            {},
            {
                definedTypes: [kind],
                pdas: [pda],
            },
        );
        expect(await resolveInstructionAccountAddress({ path })).toBe(await derive([new Uint8Array([1])]));
    });
});

describe('variable seeds', () => {
    const ownerPda = pdaNode({ identifier: 'vault', seeds: [variablePdaSeedNode('owner', publicKeyTypeNode())] });

    test('it resolves seeds from accounts', async () => {
        const owner = await generateAddress();
        const defaultValue = pdaValueNode(pdaLinkNode('vault'), {
            seeds: [pdaSeedValueNode('owner', accountValueNode('owner'))],
        });
        const { path } = getAccountPath(
            account('vault', { defaultValue }),
            { accounts: [account('owner')] },
            {
                pdas: [ownerPda],
            },
        );
        expect(await resolveInstructionAccountAddress({ accountsInput: { owner }, path })).toBe(
            await derive([pubkey(owner)]),
        );
    });

    test('it resolves seeds from nested data using the type of the seed', async () => {
        // Given a size-prefixed string within the instruction data, used as a raw string seed.
        const pda = pdaNode({ identifier: 'vault', seeds: [variablePdaSeedNode('name', stringTypeNode('utf8'))] });
        const data = structTypeNode([
            structFieldTypeNode({
                identifier: 'config',
                type: structTypeNode([
                    structFieldTypeNode({
                        identifier: 'names',
                        type: structTypeNode([
                            structFieldTypeNode({
                                identifier: 'first',
                                type: stringTypeNode('utf8', {
                                    transforms: [sizePrefixTransformNode(integerTypeNode('u32'))],
                                }),
                            }),
                        ]),
                    }),
                ]),
            }),
        ]);
        const defaultValue = pdaValueNode(pdaLinkNode('vault'), {
            seeds: [pdaSeedValueNode('name', dataValueNode('config.names.first'))],
        });
        const { path } = getAccountPath(account('vault', { defaultValue }), { data }, { pdas: [pda] });

        // Then the seed is the raw string, without the size prefix of the data.
        const dataInput = { config: { names: { first: 'hello' } } };
        expect(await resolveInstructionAccountAddress({ dataInput, path })).toBe(await derive([utf8('hello')]));
    });

    test('it uses the default value of data fields', async () => {
        const pda = pdaNode({ identifier: 'vault', seeds: [variablePdaSeedNode('nonce', integerTypeNode('u64'))] });
        const data = structTypeNode([
            structFieldTypeNode({
                defaultValue: integerValueNode('7'),
                identifier: 'nonce',
                type: integerTypeNode('u8'),
            }),
        ]);
        const defaultValue = pdaValueNode(pdaLinkNode('vault'), {
            seeds: [pdaSeedValueNode('nonce', dataValueNode('nonce'))],
        });
        const { path } = getAccountPath(account('vault', { defaultValue }), { data }, { pdas: [pda] });
        expect(await resolveInstructionAccountAddress({ dataInput: {}, path })).toBe(
            await derive([getU64Encoder().encode(7)]),
        );
        expect(await resolveInstructionAccountAddress({ dataInput: { nonce: 9 }, path })).toBe(
            await derive([getU64Encoder().encode(9)]),
        );
    });

    test('it resolves seeds from injected values', async () => {
        const owner = await generateAddress();
        const defaultValue = pdaValueNode(pdaLinkNode('vault'), {
            seeds: [pdaSeedValueNode('owner', injectedValueNode({ key: 'owner' }))],
        });
        const { path } = getAccountPath(
            account('vault', { defaultValue }),
            {
                provides: [providedNode('owner', publicKeyValueNode(owner))],
            },
            { pdas: [ownerPda] },
        );
        expect(await resolveInstructionAccountAddress({ path })).toBe(await derive([pubkey(owner)]));
    });

    test('it encodes missing remainder option seeds as zero bytes', async () => {
        const pda = pdaNode({
            identifier: 'vault',
            seeds: [variablePdaSeedNode('authority', remainderOptionTypeNode(publicKeyTypeNode()))],
        });
        const data = structTypeNode([
            structFieldTypeNode({ identifier: 'authority', type: remainderOptionTypeNode(publicKeyTypeNode()) }),
        ]);
        const defaultValue = pdaValueNode(pdaLinkNode('vault'), {
            seeds: [pdaSeedValueNode('authority', dataValueNode('authority'))],
        });
        const { path } = getAccountPath(account('vault', { defaultValue }), { data }, { pdas: [pda] });
        expect(await resolveInstructionAccountAddress({ dataInput: {}, path })).toBe(await derive([new Uint8Array(0)]));
    });

    test('it encodes null or missing option seeds as None', async () => {
        const pda = pdaNode({
            identifier: 'vault',
            seeds: [variablePdaSeedNode('authority', optionTypeNode(publicKeyTypeNode()))],
        });
        const data = structTypeNode([
            structFieldTypeNode({ identifier: 'authority', type: optionTypeNode(publicKeyTypeNode()) }),
        ]);
        const defaultValue = pdaValueNode(pdaLinkNode('vault'), {
            seeds: [pdaSeedValueNode('authority', dataValueNode('authority'))],
        });
        const { path } = getAccountPath(account('vault', { defaultValue }), { data }, { pdas: [pda] });
        const none = await derive([new Uint8Array([0])]);
        expect(await resolveInstructionAccountAddress({ dataInput: { authority: null }, path })).toBe(none);
        expect(await resolveInstructionAccountAddress({ dataInput: {}, path })).toBe(none);
    });

    test('it reads nested values from the default value of their parents', async () => {
        // Given a seed nested within a field whose default value is a struct.
        const owner = await generateAddress();
        const pda = pdaNode({ identifier: 'vault', seeds: [variablePdaSeedNode('owner', publicKeyTypeNode())] });
        const data = structTypeNode([
            structFieldTypeNode({
                defaultValue: structValueNode([structFieldValueNode('owner', publicKeyValueNode(owner))]),
                identifier: 'config',
                type: structTypeNode([structFieldTypeNode({ identifier: 'owner', type: publicKeyTypeNode() })]),
            }),
        ]);
        const defaultValue = pdaValueNode(pdaLinkNode('vault'), {
            seeds: [pdaSeedValueNode('owner', dataValueNode('config.owner'))],
        });
        const { path } = getAccountPath(account('vault', { defaultValue }), { data }, { pdas: [pda] });

        // Then the seed uses the parent's default value when the parent is missing, as its codec would.
        expect(await resolveInstructionAccountAddress({ dataInput: {}, path })).toBe(await derive([pubkey(owner)]));
        const other = await generateAddress();
        expect(await resolveInstructionAccountAddress({ dataInput: { config: { owner: other } }, path })).toBe(
            await derive([pubkey(other)]),
        );
    });

    test('it throws when a seed value is missing', async () => {
        const data = structTypeNode([structFieldTypeNode({ identifier: 'owner', type: publicKeyTypeNode() })]);
        const defaultValue = pdaValueNode(pdaLinkNode('vault'), {
            seeds: [pdaSeedValueNode('owner', dataValueNode('owner'))],
        });
        const { path } = getAccountPath(account('vault', { defaultValue }), { data }, { pdas: [ownerPda] });
        await expectCodamaError(
            resolveInstructionAccountAddress({ dataInput: {}, path }),
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__PDA_SEED_MISSING, {
                pdaName: ownerPda.identifier,
                seedName: ownerPda.seeds![0].identifier,
            }),
        );
    });

    test('it throws when a seed value is not provided by the PDA value', async () => {
        const { path } = getAccountPath(
            account('vault', { defaultValue: pdaValueNode(pdaLinkNode('vault')) }),
            {},
            {
                pdas: [ownerPda],
            },
        );
        await expectCodamaError(
            resolveInstructionAccountAddress({ path }),
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__NODE_REFERENCE_NOT_FOUND, {
                instructionName: path[2].identifier,
                referencedName: ownerPda.seeds![0].identifier,
            }),
        );
    });

    test('it throws when a data path does not exist', async () => {
        const data = structTypeNode([structFieldTypeNode({ identifier: 'owner', type: publicKeyTypeNode() })]);
        const defaultValue = pdaValueNode(pdaLinkNode('vault'), {
            seeds: [pdaSeedValueNode('owner', dataValueNode('missing'))],
        });
        const { path } = getAccountPath(account('vault', { defaultValue }), { data }, { pdas: [ownerPda] });
        await expect(resolveInstructionAccountAddress({ dataInput: {}, path })).rejects.toThrow(
            expect.objectContaining({
                context: expect.objectContaining({
                    __code: CODAMA_ERROR__CANNOT_RESOLVE_PATH,
                    path: pathString('missing'),
                    segment: 'missing',
                }),
            }),
        );
    });
});

describe('program addresses', () => {
    const pda = pdaNode({
        identifier: 'vault',
        seeds: [constantPdaSeedNode(stringTypeNode('utf8'), stringValueNode('v'))],
    });

    test('it uses the program ID of the PDA value, from data or accounts', async () => {
        const data = structTypeNode([structFieldTypeNode({ identifier: 'program', type: publicKeyTypeNode() })]);
        const fromData = pdaValueNode(pdaLinkNode('vault'), { programId: dataValueNode('program') });
        const fromAccount = pdaValueNode(pdaLinkNode('vault'), { programId: accountValueNode('program') });
        const expected = await derive([utf8('v')], OTHER_PROGRAM);

        const dataPath = getAccountPath(account('vault', { defaultValue: fromData }), { data }, { pdas: [pda] }).path;
        expect(await resolveInstructionAccountAddress({ dataInput: { program: OTHER_PROGRAM }, path: dataPath })).toBe(
            expected,
        );
        const accountPath = getAccountPath(
            account('vault', { defaultValue: fromAccount }),
            {
                accounts: [account('program')],
            },
            { pdas: [pda] },
        ).path;
        expect(
            await resolveInstructionAccountAddress({ accountsInput: { program: OTHER_PROGRAM }, path: accountPath }),
        ).toBe(expected);
    });

    test('it throws when the program ID data is not an address', async () => {
        const data = structTypeNode([structFieldTypeNode({ identifier: 'program', type: publicKeyTypeNode() })]);
        const defaultValue = pdaValueNode(pdaLinkNode('vault'), { programId: dataValueNode('program') });
        const { path } = getAccountPath(account('vault', { defaultValue }), { data }, { pdas: [pda] });
        await expectCodamaError(
            resolveInstructionAccountAddress({ dataInput: { program: 42 }, path }),
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE, {
                accountName: path[3].identifier,
                actualType: 'number',
                expectedType: 'Address | PublicKey',
            }),
        );
    });

    test('it encodes constant program ID seeds with the resolved program address', async () => {
        const withProgramIdSeed = pdaNode({
            identifier: 'vault',
            seeds: [constantPdaSeedNode(publicKeyTypeNode(), programIdValueNode())],
        });
        const data = structTypeNode([structFieldTypeNode({ identifier: 'program', type: publicKeyTypeNode() })]);
        const defaultValue = pdaValueNode(pdaLinkNode('vault'), { programId: dataValueNode('program') });
        const { path } = getAccountPath(account('vault', { defaultValue }), { data }, { pdas: [withProgramIdSeed] });
        expect(await resolveInstructionAccountAddress({ dataInput: { program: OTHER_PROGRAM }, path })).toBe(
            await derive([pubkey(OTHER_PROGRAM)], OTHER_PROGRAM),
        );
    });

    test('it throws when the program ID data is missing', async () => {
        const data = structTypeNode([structFieldTypeNode({ identifier: 'program', type: publicKeyTypeNode() })]);
        const defaultValue = pdaValueNode(pdaLinkNode('vault'), { programId: dataValueNode('program') });
        const { path } = getAccountPath(account('vault', { defaultValue }), { data }, { pdas: [pda] });
        await expectCodamaError(
            resolveInstructionAccountAddress({ dataInput: {}, path }),
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__DATA_MISSING, {
                instructionName: path[2].identifier,
                path: pathString('program'),
            }),
        );
    });

    test('it uses the program of linked PDAs', async () => {
        // Given an instruction of programA using a PDA of programB.
        const target = account('vault', {
            defaultValue: pdaValueNode(pdaLinkNode('vault', { program: programLinkNode('b') })),
        });
        const instruction = instructionNode({ accounts: [target], identifier: 'ix' });
        const programA = programNode({ identifier: 'a', instructions: [instruction], publicKey: PROGRAM_ADDRESS });
        const programB = programNode({ identifier: 'b', pdas: [pda], publicKey: OTHER_PROGRAM });
        const root = rootNode(programA, { additionalPrograms: [programB] });

        // Then the PDA is derived from programB.
        const path = [root, programA, instruction, target] as const;
        expect(await resolveInstructionAccountAddress({ path })).toBe(await derive([utf8('v')], OTHER_PROGRAM));
    });

    test('it uses the program ID of the PDA when provided', async () => {
        const withProgramId = pdaNode({ ...pda, programId: OTHER_PROGRAM });
        const { path } = getAccountPath(account('vault', { defaultValue: pdaValueNode(withProgramId) }));
        expect(await resolveInstructionAccountAddress({ path })).toBe(await derive([utf8('v')], OTHER_PROGRAM));
    });
});
