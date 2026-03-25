import { address } from '@solana/addresses';
import { AccountRole } from '@solana/instructions';
import type { InstructionNode, RootNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createAccountMeta } from '../../../src/instruction-encoding/accounts/create-account-meta';
import { loadRoot } from '../../programs/test-utils';

const ADDR_1 = address('11111111111111111111111111111111');
const ADDR_2 = address('22222222222222222222222222222222222222222222');
const ADDR_3 = address('33333333333333333333333333333333333333333333');
const MULTISIG_ADDR = address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

describe('createAccountMeta: remaining accounts', () => {
    test('should append remaining accounts from argumentsInput', async () => {
        // initializeMultisig has remainingAccounts: [{ value: argumentValueNode("signers") }]
        // It has 2 regular accounts: multisig (user-provided) + rent (default: SysvarRent)
        const root = loadRoot('token-idl.json');
        const ix = getInstruction(root, 'initializeMultisig');

        const result = await createAccountMeta(
            root,
            ix,
            { m: 2, signers: [ADDR_1, ADDR_2, ADDR_3] },
            { multisig: MULTISIG_ADDR },
        );

        // 2 regular accounts (multisig + rent) + 3 remaining accounts
        expect(result).toHaveLength(5);
        const remainingAccounts = result.slice(2);
        expect(remainingAccounts[0]).toEqual({ address: ADDR_1, role: AccountRole.READONLY });
        expect(remainingAccounts[1]).toEqual({ address: ADDR_2, role: AccountRole.READONLY });
        expect(remainingAccounts[2]).toEqual({ address: ADDR_3, role: AccountRole.READONLY });
    });

    test('should use READONLY_SIGNER role when isSigner is true', async () => {
        // transfer has remainingAccounts: [{ value: argumentValueNode("multiSigners"), isOptional: true, isSigner: true }]
        // It has 3 regular accounts: source, destination, authority (default: identity)
        const root = loadRoot('token-idl.json');
        const ix = getInstruction(root, 'transfer');

        const result = await createAccountMeta(
            root,
            ix,
            { amount: 100, multiSigners: [ADDR_1, ADDR_2] },
            { authority: ADDR_3, destination: MULTISIG_ADDR, source: ADDR_3 },
        );

        // 3 regular accounts + 2 remaining accounts
        const remainingAccounts = result.slice(3);
        expect(remainingAccounts).toHaveLength(2);
        expect(remainingAccounts[0]).toEqual({ address: ADDR_1, role: AccountRole.READONLY_SIGNER });
        expect(remainingAccounts[1]).toEqual({ address: ADDR_2, role: AccountRole.READONLY_SIGNER });
    });

    test('should skip optional remaining accounts when not provided', async () => {
        // transfer's multiSigners is optional — omitting it should produce no extra accounts
        const root = loadRoot('token-idl.json');
        const ix = getInstruction(root, 'transfer');

        const result = await createAccountMeta(
            root,
            ix,
            { amount: 100 },
            { authority: ADDR_1, destination: MULTISIG_ADDR, source: ADDR_3 },
        );

        // Only 3 regular accounts, no remaining
        expect(result).toHaveLength(3);
    });

    test('should append empty array as no remaining accounts', async () => {
        const root = loadRoot('token-idl.json');
        const ix = getInstruction(root, 'initializeMultisig');

        const result = await createAccountMeta(root, ix, { m: 1, signers: [] }, { multisig: MULTISIG_ADDR });

        // 2 regular accounts (multisig + rent), no remaining
        expect(result).toHaveLength(2);
    });

    test('should return no remaining accounts when instruction has none defined', async () => {
        // initializeMint has no remainingAccounts
        const root = loadRoot('token-idl.json');
        const ix = getInstruction(root, 'initializeMint');

        const result = await createAccountMeta(
            root,
            ix,
            { decimals: 9, freezeAuthority: null, mintAuthority: ADDR_1 },
            { mint: MULTISIG_ADDR },
        );

        // Should only have regular accounts (mint + rent sysvar)
        expect(result).toHaveLength(2);
    });

    test('should throw when remaining account argument is not an array', async () => {
        const root = loadRoot('token-idl.json');
        const ix = getInstruction(root, 'initializeMultisig');

        await expect(
            createAccountMeta(root, ix, { m: 2, signers: ADDR_1 }, { multisig: MULTISIG_ADDR }),
        ).rejects.toThrow('Remaining account argument "signers" must be an array of addresses');
    });

    test('should throw when remaining account value kind is not argumentValueNode', async () => {
        const root = loadRoot('token-idl.json');
        const ix = getInstruction(root, 'initializeMultisig');

        // Replace the argumentValueNode with an unsupported value kind
        const remainingAccount = ix.remainingAccounts?.[0];
        const modifiedRemainingAccount = Object.assign({}, remainingAccount, {
            value: { kind: 'resolverValueNode', name: 'someResolver' },
        }) as typeof remainingAccount;
        const modifiedIx: InstructionNode = Object.assign({}, ix, {
            remainingAccounts: [modifiedRemainingAccount],
        });

        await expect(createAccountMeta(root, modifiedIx, { m: 2 }, { multisig: MULTISIG_ADDR })).rejects.toThrow(
            'Unsupported remaining accounts value kind: "resolverValueNode"',
        );
    });

    test('should throw when remaining account array contains invalid element types', async () => {
        const root = loadRoot('token-idl.json');
        const ix = getInstruction(root, 'initializeMultisig');

        await expect(
            createAccountMeta(root, ix, { m: 2, signers: [ADDR_1, 123] }, { multisig: MULTISIG_ADDR }),
        ).rejects.toThrow('Remaining account argument "signers[1]" must be an address string or PublicKey, got number');
    });

    test('should throw when required remaining account argument is not provided', async () => {
        const root = loadRoot('token-idl.json');
        const ix = getInstruction(root, 'initializeMultisig');

        // signers is required:
        await expect(
            createAccountMeta(root, ix, { m: 2, signers: undefined }, { multisig: MULTISIG_ADDR }),
        ).rejects.toThrow('Remaining account argument "signers" is required but was not provided');
    });
});

function getInstruction(root: RootNode, name: string): InstructionNode {
    const ix = root.program.instructions.find(i => i.name === name);
    if (!ix) throw new Error(`Instruction ${name} not found`);
    return ix;
}
