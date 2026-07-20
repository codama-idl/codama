import { address } from '@solana/addresses';
import { AccountRole } from '@solana/instructions';
import type { InstructionNode } from 'codama';
import {
    argumentValueNode,
    identityValueNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionNode,
    instructionRemainingAccountsNode,
    numberTypeNode,
    optionTypeNode,
    programNode,
    publicKeyTypeNode,
    publicKeyValueNode,
    rootNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { createAccountMeta } from '../../src/accounts/create-account-meta';

const ADDR_1 = address('11111111111111111111111111111111');
const ADDR_2 = address('22222222222222222222222222222222222222222222');
const ADDR_3 = address('33333333333333333333333333333333333333333333');
const MULTISIG_ADDR = address('ALUceMetVMsZCKsVmB5JhmvswTFsbkAgmj8fGLLv2wwL');
const PROGRAM_KEY = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

function makeRoot(ix: InstructionNode) {
    return rootNode(programNode({ instructions: [ix], name: 'test', publicKey: PROGRAM_KEY }));
}

// initializeMultisig: 2 accounts + remainingAccounts(signers)
const initMultisigIx = instructionNode({
    accounts: [
        instructionAccountNode({ isSigner: false, isWritable: true, name: 'multisig' }),
        instructionAccountNode({
            defaultValue: publicKeyValueNode('SysvarRent111111111111111111111111111111111'),
            isSigner: false,
            isWritable: false,
            name: 'rent',
        }),
    ],
    arguments: [instructionArgumentNode({ name: 'm', type: numberTypeNode('u8') })],
    name: 'initializeMultisig',
    remainingAccounts: [
        instructionRemainingAccountsNode(argumentValueNode('signers'), { isOptional: false, isSigner: false }),
    ],
});
const initMultisigRoot = makeRoot(initMultisigIx);

// transfer: 3 accounts + optional remainingAccounts(multiSigners, isSigner)
const transferIx = instructionNode({
    accounts: [
        instructionAccountNode({ isSigner: false, isWritable: true, name: 'source' }),
        instructionAccountNode({ isSigner: false, isWritable: true, name: 'destination' }),
        instructionAccountNode({
            defaultValue: identityValueNode(),
            isSigner: 'either',
            isWritable: false,
            name: 'authority',
        }),
    ],
    arguments: [instructionArgumentNode({ name: 'amount', type: numberTypeNode('u64') })],
    name: 'transfer',
    remainingAccounts: [
        instructionRemainingAccountsNode(argumentValueNode('multiSigners'), { isOptional: true, isSigner: true }),
    ],
});
const transferRoot = makeRoot(transferIx);

// initializeMint: 2 accounts, no remainingAccounts
const initMintMintAccount = instructionAccountNode({ isSigner: false, isWritable: true, name: 'mint' });
const initMintIx = instructionNode({
    accounts: [
        initMintMintAccount,
        instructionAccountNode({
            defaultValue: publicKeyValueNode('SysvarRent111111111111111111111111111111111'),
            isSigner: false,
            isWritable: false,
            name: 'rent',
        }),
    ],
    arguments: [
        instructionArgumentNode({ name: 'decimals', type: numberTypeNode('u8') }),
        instructionArgumentNode({ name: 'mintAuthority', type: publicKeyTypeNode() }),
        instructionArgumentNode({ name: 'freezeAuthority', type: optionTypeNode(publicKeyTypeNode()) }),
    ],
    name: 'initializeMint',
});
const initMintRoot = makeRoot(initMintIx);

describe('createAccountMeta: remaining accounts', () => {
    test('should append remaining accounts from argumentsInput', async () => {
        const result = await createAccountMeta(
            initMultisigRoot,
            initMultisigIx,
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
        const result = await createAccountMeta(
            transferRoot,
            transferIx,
            { amount: 100, multiSigners: [ADDR_1, ADDR_2] },
            { authority: ADDR_3, destination: MULTISIG_ADDR, source: ADDR_3 },
        );

        const remainingAccounts = result.slice(3);
        expect(remainingAccounts).toHaveLength(2);
        expect(remainingAccounts[0]).toEqual({ address: ADDR_1, role: AccountRole.READONLY_SIGNER });
        expect(remainingAccounts[1]).toEqual({ address: ADDR_2, role: AccountRole.READONLY_SIGNER });
    });

    test('should skip optional remaining accounts when not provided', async () => {
        const result = await createAccountMeta(
            transferRoot,
            transferIx,
            { amount: 100 },
            { authority: ADDR_1, destination: MULTISIG_ADDR, source: ADDR_3 },
        );

        expect(result).toHaveLength(3);
    });

    test('should append empty array as no remaining accounts', async () => {
        const result = await createAccountMeta(
            initMultisigRoot,
            initMultisigIx,
            { m: 1, signers: [] },
            { multisig: MULTISIG_ADDR },
        );

        expect(result).toHaveLength(2);
    });

    test('should return no remaining accounts when instruction has none defined', async () => {
        const result = await createAccountMeta(
            initMintRoot,
            initMintIx,
            { decimals: 9, freezeAuthority: null, mintAuthority: ADDR_1 },
            { mint: MULTISIG_ADDR },
        );

        expect(result).toHaveLength(2);
    });

    test('should throw when remaining account argument is not an array', async () => {
        await expect(
            createAccountMeta(initMultisigRoot, initMultisigIx, { m: 2, signers: ADDR_1 }, { multisig: MULTISIG_ADDR }),
        ).rejects.toThrow(
            'Invalid argument input [signers]: ["11111111111111111111111111111111"]. Expected [Address[]].',
        );
    });

    test('should throw when remaining account value kind is not argumentValueNode', async () => {
        const remainingAccount = initMultisigIx.remainingAccounts?.[0];
        const modifiedRemainingAccount = Object.assign({}, remainingAccount, {
            value: { kind: 'resolverValueNode', name: 'someResolver' },
        }) as typeof remainingAccount;
        const modifiedIx: InstructionNode = Object.assign({}, initMultisigIx, {
            remainingAccounts: [modifiedRemainingAccount],
        });

        await expect(
            createAccountMeta(initMultisigRoot, modifiedIx, { m: 2 }, { multisig: MULTISIG_ADDR }),
        ).rejects.toThrow(/Expected node of kind \[argumentValueNode\], got \[resolverValueNode\]/);
    });

    test('should throw when remaining account array contains invalid element types', async () => {
        await expect(
            createAccountMeta(
                initMultisigRoot,
                initMultisigIx,
                { m: 2, signers: [ADDR_1, 123] },
                { multisig: MULTISIG_ADDR },
            ),
        ).rejects.toThrow(/Expected \[Address \| PublicKey\] for account \[signers\[1\]\]/);
    });

    test('should throw when required remaining account argument is not provided', async () => {
        await expect(
            createAccountMeta(
                initMultisigRoot,
                initMultisigIx,
                { m: 2, signers: undefined },
                { multisig: MULTISIG_ADDR },
            ),
        ).rejects.toThrow(/Missing argument \[signers\]/);
    });
});

describe('createAccountMeta: UNSUPPORTED_OPTIONAL_ACCOUNT_STRATEGY', () => {
    test('should throw when optionalAccountStrategy is unsupported', async () => {
        const optionalAccount = {
            ...initMintMintAccount,
            defaultValue: undefined,
            isOptional: true,
        };

        const modifiedIx: InstructionNode = {
            ...initMintIx,
            accounts: [optionalAccount],
            // @ts-expect-error - we're intentionally passing an invalid strategy to test error handling
            optionalAccountStrategy: 'invalid',
        };

        await expect(createAccountMeta(initMintRoot, modifiedIx, {}, { [optionalAccount.name]: null })).rejects.toThrow(
            'Unsupported optional account strategy ["invalid"] for account [mint] in [initializeMint].',
        );
    });
});
