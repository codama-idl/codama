import { getNodeValueCodec } from '@codama/dynamic-codecs';
import {
    CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE,
    CODAMA_ERROR__LINKED_NODE_NOT_FOUND,
} from '@codama/errors';
import type { EncodedAccount } from '@solana/accounts';
import type { Address } from '@solana/addresses';
import { getBase16Encoder } from '@solana/codecs';
import { AccountRole } from '@solana/instructions';
import {
    accountDataValueNode,
    accountLinkNode,
    accountNode,
    definedTypeLinkNode,
    definedTypeNode,
    injectedValueNode,
    instructionAccountNode,
    instructionNode,
    instructionRemainingAccountsNode,
    integerTypeNode,
    LinkableDictionary,
    programNode,
    providedNode,
    publicKeyTypeNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
} from 'codama';
import { describe, expect, test, vi } from 'vitest';

import { createInstructionsBuilder, type FetchAccountsFn } from '../src';
import { generateAddress, getInstructionPath, PROGRAM_ADDRESS } from './_setup';

const transfer = instructionNode({
    accounts: [
        instructionAccountNode({ identifier: 'source', isSigner: false, isWritable: true }),
        instructionAccountNode({ identifier: 'authority', isSigner: 'either', isWritable: false }),
    ],
    data: structTypeNode([structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u16') })]),
    identifier: 'transfer',
    remainingAccounts: [instructionRemainingAccountsNode('signers', { isOptional: true, isSigner: true })],
});

describe('createInstructionsBuilder', () => {
    test('it builds instructions from their accounts, data and signers', async () => {
        const [source, authority, signer] = await Promise.all([
            generateAddress(),
            generateAddress(),
            generateAddress(),
        ]);
        const build = createInstructionsBuilder(getInstructionPath(transfer));
        const instruction = await build({
            accounts: { authority, signers: [signer], source },
            data: { amount: 42 },
            signers: ['authority'],
        });
        expect(instruction).toStrictEqual({
            accounts: [
                { address: source, role: AccountRole.WRITABLE },
                { address: authority, role: AccountRole.READONLY_SIGNER },
                { address: signer, role: AccountRole.READONLY_SIGNER },
            ],
            data: getBase16Encoder().encode('2a00'),
            programAddress: PROGRAM_ADDRESS,
        });
    });

    test('it builds instructions without inputs', async () => {
        const build = createInstructionsBuilder(getInstructionPath(instructionNode({ identifier: 'noop' })));
        expect(await build()).toStrictEqual({ accounts: [], data: new Uint8Array(), programAddress: PROGRAM_ADDRESS });
    });

    test('it uses the address of the program defining the instruction', async () => {
        const otherAddress = await generateAddress();
        const noop = instructionNode({ identifier: 'noop' });
        const other = programNode({ identifier: 'other', instructions: [noop], publicKey: otherAddress });
        const root = rootNode(programNode({ identifier: 'main', publicKey: PROGRAM_ADDRESS }), {
            additionalPrograms: [other],
        });
        const build = createInstructionsBuilder([root, other, noop]);
        expect((await build()).programAddress).toBe(otherAddress);
    });

    test('it uses the given linkables rather than recording them', () => {
        // Given an instruction whose data links to a defined type, and linkables that do not record it.
        const args = definedTypeNode({ identifier: 'args', type: transfer.data! });
        const path = getInstructionPath(instructionNode({ ...transfer, data: definedTypeLinkNode('args') }), {
            definedTypes: [args],
        });

        // Then the link cannot be resolved from them.
        expect(() => createInstructionsBuilder(path, { linkables: new LinkableDictionary() })).toThrow(
            expect.objectContaining({
                context: expect.objectContaining({ __code: CODAMA_ERROR__LINKED_NODE_NOT_FOUND }),
            }),
        );
    });

    test('it rejects data of the wrong type', async () => {
        const [source, authority] = await Promise.all([generateAddress(), generateAddress()]);
        const build = createInstructionsBuilder(getInstructionPath(transfer));
        await expect(build({ accounts: { authority, source }, data: { amount: 'abc' } })).rejects.toThrow(
            expect.objectContaining({
                context: expect.objectContaining({ __code: CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE }),
            }),
        );
    });
});

describe('reading account data', () => {
    // A `transferChecked` whose `decimals` and `authority` default to the data of its mint.
    const mint = accountNode({
        data: structTypeNode([
            structFieldTypeNode({ identifier: 'mintAuthority', type: publicKeyTypeNode() }),
            structFieldTypeNode({ identifier: 'decimals', type: integerTypeNode('u8') }),
        ]),
        identifier: 'mint',
    });
    const transferChecked = instructionNode({
        accounts: [
            instructionAccountNode({
                accountLink: accountLinkNode('mint'),
                identifier: 'mint',
                isSigner: false,
                isWritable: false,
            }),
            instructionAccountNode({
                defaultValue: accountDataValueNode('mint', { path: 'mintAuthority' }),
                identifier: 'authority',
                isSigner: false,
                isWritable: false,
            }),
        ],
        data: structTypeNode([
            structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u16') }),
            structFieldTypeNode({
                defaultValue: injectedValueNode({ key: 'decimals' }),
                identifier: 'decimals',
                type: integerTypeNode('u8'),
            }),
        ]),
        identifier: 'transferChecked',
        provides: [providedNode('decimals', accountDataValueNode('mint', { path: 'decimals' }))],
    });
    const path = getInstructionPath(transferChecked, { accounts: [mint] });

    async function getMintAccount(): Promise<{ authority: Address; mintAccount: EncodedAccount }> {
        const [address, authority] = await Promise.all([generateAddress(), generateAddress()]);
        const data = getNodeValueCodec([path[0], path[1], mint]).encode({ decimals: 6, mintAuthority: authority });
        const mintAccount: EncodedAccount = {
            address,
            data: data as Uint8Array,
            executable: false,
            lamports: 0n as EncodedAccount['lamports'],
            programAddress: PROGRAM_ADDRESS,
            space: BigInt(data.length),
        };
        return { authority, mintAccount };
    }

    const getFetchAccounts = (accounts: EncodedAccount[]) =>
        vi.fn<FetchAccountsFn>(addresses =>
            Promise.resolve(addresses.map(address => accounts.find(account => account.address === address)!)),
        );

    test('it reads account data into the data and the accounts', async () => {
        const { authority, mintAccount } = await getMintAccount();
        const build = createInstructionsBuilder(path, { fetchAccounts: getFetchAccounts([mintAccount]) });
        const instruction = await build({ accounts: { mint: mintAccount.address }, data: { amount: 42 } });
        expect(instruction).toStrictEqual({
            accounts: [
                { address: mintAccount.address, role: AccountRole.READONLY },
                { address: authority, role: AccountRole.READONLY },
            ],
            data: getBase16Encoder().encode('2a0006'),
            programAddress: PROGRAM_ADDRESS,
        });
    });

    test('it fetches each account once per instruction', async () => {
        const { mintAccount } = await getMintAccount();
        const fetchAccounts = getFetchAccounts([mintAccount]);
        const build = createInstructionsBuilder(path, { fetchAccounts });
        await build({ accounts: { mint: mintAccount.address }, data: { amount: 42 } });
        expect(fetchAccounts.mock.calls).toEqual([[[mintAccount.address]]]);
    });

    test('it fetches accounts again for each build', async () => {
        const { mintAccount } = await getMintAccount();
        const fetchAccounts = getFetchAccounts([mintAccount]);
        const build = createInstructionsBuilder(path, { fetchAccounts });
        await build({ accounts: { mint: mintAccount.address }, data: { amount: 42 } });
        await build({ accounts: { mint: mintAccount.address }, data: { amount: 42 } });
        expect(fetchAccounts).toHaveBeenCalledTimes(2);
    });

    test('it does not read account data for provided data', async () => {
        const authority = await generateAddress();
        const fetchAccounts = getFetchAccounts([]);
        const build = createInstructionsBuilder(path, { fetchAccounts });
        const instruction = await build({
            accounts: { authority, mint: authority },
            data: { amount: 42, decimals: 9 },
        });
        expect(instruction.data).toStrictEqual(getBase16Encoder().encode('2a0009'));
        expect(fetchAccounts).not.toHaveBeenCalled();
    });

    test('it reports data errors before account errors', async () => {
        // Given data of the wrong type and missing accounts.
        const build = createInstructionsBuilder(getInstructionPath(transfer));
        await expect(build({ accounts: {}, data: { amount: 'abc' } })).rejects.toThrow(
            expect.objectContaining({
                context: expect.objectContaining({ __code: CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE }),
            }),
        );
        await expect(build({ accounts: {}, data: { amount: 42 } })).rejects.toThrow(
            expect.objectContaining({
                context: expect.objectContaining({ __code: CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING }),
            }),
        );
    });
});
