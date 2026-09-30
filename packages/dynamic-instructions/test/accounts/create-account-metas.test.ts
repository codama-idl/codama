import {
    CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ACCOUNT_ADDRESS,
    CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ACCOUNT_INPUT,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE,
    CodamaError,
} from '@codama/errors';
import { type Address, getAddressEncoder, getProgramDerivedAddress } from '@solana/addresses';
import { AccountRole } from '@solana/instructions';
import {
    dataValueNode,
    instructionAccountNode,
    type InstructionAccountNodeInput,
    instructionNode,
    type InstructionNodeInput,
    instructionRemainingAccountsNode,
    integerTypeNode,
    pdaNode,
    pdaSeedValueNode,
    pdaValueNode,
    programNode,
    publicKeyTypeNode,
    publicKeyValueNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
    variablePdaSeedNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { createAccountMetas } from '../../src';
import { generateAddress, getInstructionPath, PROGRAM_ADDRESS } from '../_setup';

const RENT = 'SysvarRent111111111111111111111111111111111' as Address;

function account(identifier: string, input: Partial<InstructionAccountNodeInput> = {}) {
    return instructionAccountNode({ identifier, isSigner: false, isWritable: false, ...input });
}

function instruction(input: Partial<InstructionNodeInput> = {}) {
    return instructionNode({ identifier: 'testInstruction', ...input });
}

/** Expect the promise to reject with a Codama error with exactly the given context. */
async function expectCodamaError(promise: Promise<unknown>, expected: CodamaError): Promise<void> {
    await expect(promise).rejects.toThrow(expect.objectContaining({ context: expected.context }));
}

describe('accounts', () => {
    test('it creates account metas in order with their roles', async () => {
        const [a, b, c, d] = await Promise.all([
            generateAddress(),
            generateAddress(),
            generateAddress(),
            generateAddress(),
        ]);
        const path = getInstructionPath(
            instruction({
                accounts: [
                    account('readonly'),
                    account('writable', { isWritable: true }),
                    account('signer', { isSigner: true }),
                    account('writableSigner', { isSigner: true, isWritable: true }),
                ],
            }),
        );
        const accounts = { readonly: a, signer: c, writable: b, writableSigner: d };
        expect(await createAccountMetas({ accounts, path })).toStrictEqual([
            { address: a, role: AccountRole.READONLY },
            { address: b, role: AccountRole.WRITABLE },
            { address: c, role: AccountRole.READONLY_SIGNER },
            { address: d, role: AccountRole.WRITABLE_SIGNER },
        ]);
    });

    test('it resolves accounts that are not provided from their default values', async () => {
        const path = getInstructionPath(
            instruction({ accounts: [account('rent', { defaultValue: publicKeyValueNode(RENT) })] }),
        );
        expect(await createAccountMetas({ path })).toStrictEqual([{ address: RENT, role: AccountRole.READONLY }]);
    });

    test('it resolves default values from the instruction data', async () => {
        // Given an account whose default value is a PDA derived from the instruction data.
        const owner = await generateAddress();
        const vault = pdaNode({ identifier: 'vault', seeds: [variablePdaSeedNode('owner', publicKeyTypeNode())] });
        const path = getInstructionPath(
            instruction({
                accounts: [
                    account('vault', {
                        defaultValue: pdaValueNode(vault, {
                            seeds: [pdaSeedValueNode('owner', dataValueNode('owner'))],
                        }),
                    }),
                ],
                data: structTypeNode([structFieldTypeNode({ identifier: 'owner', type: publicKeyTypeNode() })]),
            }),
        );

        // Then the PDA is derived from the provided data.
        const [expected] = await getProgramDerivedAddress({
            programAddress: PROGRAM_ADDRESS,
            seeds: [getAddressEncoder().encode(owner)],
        });
        expect(await createAccountMetas({ data: { owner }, path })).toStrictEqual([
            { address: expected, role: AccountRole.READONLY },
        ]);
    });

    test('it throws when a required account is missing', async () => {
        const path = getInstructionPath(instruction({ accounts: [account('mint')] }));
        await expectCodamaError(
            createAccountMetas({ path }),
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING, {
                accountName: 'mint',
                instructionName: 'testInstruction',
            }),
        );
    });

    test('it throws when a provided address is invalid', async () => {
        const address = await generateAddress();
        const path = getInstructionPath(
            instruction({ accounts: [account('mint', { defaultValue: publicKeyValueNode(RENT) })] }),
        );
        await expectCodamaError(
            createAccountMetas({ accounts: { mint: 'abc' }, path }),
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ACCOUNT_ADDRESS, {
                accountName: 'mint',
                value: '"abc"',
            }),
        );
        // Lists are only accepted by remaining accounts.
        await expectCodamaError(
            createAccountMetas({ accounts: { mint: [address] }, path }),
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE, {
                accountName: 'mint',
                actualType: 'array (length 1)',
                expectedType: 'Address | PublicKey',
            }),
        );
    });

    test('it ignores provided addresses of unknown accounts', async () => {
        const [mint, other] = await Promise.all([generateAddress(), generateAddress()]);
        const path = getInstructionPath(instruction({ accounts: [account('mint')] }));
        expect(await createAccountMetas({ accounts: { mint, other }, path })).toStrictEqual([
            { address: mint, role: AccountRole.READONLY },
        ]);
    });
});

describe('optional accounts', () => {
    test('it uses the program address as readonly with the programId strategy', async () => {
        // Given a writable optional account, with the default `programId` strategy.
        const path = getInstructionPath(
            instruction({ accounts: [account('buffer', { isOptional: true, isWritable: true })] }),
        );

        // Then it resolves to the program address, downgraded to readonly.
        expect(await createAccountMetas({ accounts: { buffer: null }, path })).toStrictEqual([
            { address: PROGRAM_ADDRESS, role: AccountRole.READONLY },
        ]);
    });

    test('it keeps the role of provided optional accounts', async () => {
        const buffer = await generateAddress();
        const path = getInstructionPath(
            instruction({ accounts: [account('buffer', { isOptional: true, isWritable: true })] }),
        );
        expect(await createAccountMetas({ accounts: { buffer }, path })).toStrictEqual([
            { address: buffer, role: AccountRole.WRITABLE },
        ]);
    });

    test('it omits optional accounts with the omitted strategy', async () => {
        const mint = await generateAddress();
        const path = getInstructionPath(
            instruction({
                accounts: [account('buffer', { isOptional: true }), account('mint')],
                optionalAccountStrategy: 'omitted',
            }),
        );
        expect(await createAccountMetas({ accounts: { buffer: null, mint }, path })).toStrictEqual([
            { address: mint, role: AccountRole.READONLY },
        ]);
    });

    test('it uses the address of the program defining the instruction', async () => {
        // Given an instruction of an additional program.
        const otherAddress = await generateAddress();
        const ix = instruction({ accounts: [account('buffer', { isOptional: true, isWritable: true })] });
        const other = programNode({ identifier: 'other', instructions: [ix], publicKey: otherAddress });
        const root = rootNode(programNode({ identifier: 'main', publicKey: PROGRAM_ADDRESS }), {
            additionalPrograms: [other],
        });

        // Then optional accounts resolve to the address of that program, downgraded to readonly.
        expect(await createAccountMetas({ accounts: { buffer: null }, path: [root, other, ix] })).toStrictEqual([
            { address: otherAddress, role: AccountRole.READONLY },
        ]);
    });
});

describe('either signers', () => {
    test('it marks accounts with isSigner either as signers when listed', async () => {
        const authority = await generateAddress();
        const path = getInstructionPath(instruction({ accounts: [account('authority', { isSigner: 'either' })] }));
        expect(await createAccountMetas({ accounts: { authority }, path })).toStrictEqual([
            { address: authority, role: AccountRole.READONLY },
        ]);
        expect(await createAccountMetas({ accounts: { authority }, path, signers: ['authority'] })).toStrictEqual([
            { address: authority, role: AccountRole.READONLY_SIGNER },
        ]);
    });
});

describe('remaining accounts', () => {
    const multisig = instruction({
        accounts: [account('multisig', { isWritable: true })],
        data: structTypeNode([structFieldTypeNode({ identifier: 'm', type: integerTypeNode('u8') })]),
        remainingAccounts: [instructionRemainingAccountsNode('signers')],
    });
    const multisigPath = getInstructionPath(multisig);

    test('it appends remaining accounts from their list of addresses', async () => {
        const [multisigAddress, a, b] = await Promise.all([generateAddress(), generateAddress(), generateAddress()]);
        expect(
            await createAccountMetas({ accounts: { multisig: multisigAddress, signers: [a, b] }, path: multisigPath }),
        ).toStrictEqual([
            { address: multisigAddress, role: AccountRole.WRITABLE },
            { address: a, role: AccountRole.READONLY },
            { address: b, role: AccountRole.READONLY },
        ]);
    });

    test('it uses the roles of the remaining accounts', async () => {
        const [a, b] = await Promise.all([generateAddress(), generateAddress()]);
        const path = getInstructionPath(
            instruction({
                remainingAccounts: [
                    instructionRemainingAccountsNode('signers', { isSigner: true }),
                    instructionRemainingAccountsNode('writables', { isWritable: true }),
                ],
            }),
        );
        expect(await createAccountMetas({ accounts: { signers: [a], writables: [b] }, path })).toStrictEqual([
            { address: a, role: AccountRole.READONLY_SIGNER },
            { address: b, role: AccountRole.WRITABLE },
        ]);
    });

    test('it accepts empty lists and missing optional remaining accounts', async () => {
        const multisigAddress = await generateAddress();
        const expected = [{ address: multisigAddress, role: AccountRole.WRITABLE }];
        expect(
            await createAccountMetas({ accounts: { multisig: multisigAddress, signers: [] }, path: multisigPath }),
        ).toStrictEqual(expected);

        const optionalPath = getInstructionPath({
            ...multisig,
            remainingAccounts: [instructionRemainingAccountsNode('signers', { isOptional: true })],
        });
        expect(await createAccountMetas({ accounts: { multisig: multisigAddress }, path: optionalPath })).toStrictEqual(
            expected,
        );
    });

    test('it throws when required remaining accounts are missing', async () => {
        const multisigAddress = await generateAddress();
        await expectCodamaError(
            createAccountMetas({ accounts: { multisig: multisigAddress }, path: multisigPath }),
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING, {
                accountName: 'signers',
                instructionName: 'testInstruction',
            }),
        );
    });

    test('it throws when remaining accounts are not a list', async () => {
        const [multisigAddress, a] = await Promise.all([generateAddress(), generateAddress()]);
        await expectCodamaError(
            createAccountMetas({ accounts: { multisig: multisigAddress, signers: a }, path: multisigPath }),
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ACCOUNT_INPUT, {
                accountName: 'signers',
                expectedType: 'Address[]',
                value: `"${a}"`,
            }),
        );
    });

    test('it throws when a remaining account is not an address', async () => {
        const [multisigAddress, a] = await Promise.all([generateAddress(), generateAddress()]);
        const signers = [a, 123] as unknown as Address[];
        await expectCodamaError(
            createAccountMetas({ accounts: { multisig: multisigAddress, signers }, path: multisigPath }),
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_ADDRESS_TYPE, {
                accountName: 'signers[1]',
                actualType: 'number',
                expectedType: 'Address | PublicKey',
            }),
        );
    });
});
