import {
    type AccountsInput,
    type DataInput,
    isAddressConvertible,
    resolveInstructionAccountAddress,
    toAddressOrThrow,
} from '@codama/dynamic-address-resolution';
import {
    CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ACCOUNT_ADDRESS,
    CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ACCOUNT_INPUT,
    CodamaError,
} from '@codama/errors';
import { type AccountMeta, AccountRole } from '@solana/instructions';
import {
    getLastNodeFromPath,
    type InstructionAccountNode,
    type InstructionNode,
    type InstructionRemainingAccountsNode,
    type NodePath,
} from 'codama';

import { getInstructionProgramAddress } from '../shared/program';
import type { EitherSigners } from '../shared/types';
import { safeStringify } from '../shared/util';

export type CreateAccountMetasInput<
    TAccounts extends AccountsInput = AccountsInput,
    TData extends DataInput = DataInput,
> = {
    /**
     * The addresses of the accounts, keyed by account identifier. Remaining
     * accounts are provided as lists of addresses, e.g. `{ signers: [a, b] }`.
     */
    accounts?: TAccounts;
    /** The instruction data, used to resolve default values, e.g. PDA seeds. */
    data?: TData;
    /** The path of the instruction from the root node, e.g. `[root, program, instruction]`. */
    path: NodePath<InstructionNode>;
    /** The accounts with `isSigner: 'either'` to mark as signers. */
    signers?: EitherSigners;
};

/**
 * Create the `AccountMeta`s of an instruction: its accounts, in order, followed by
 * its remaining accounts.
 *
 * Accounts that are not provided are resolved from their default values, and
 * optional accounts provided as `null` follow the `optionalAccountStrategy` of the
 * instruction, see `resolveInstructionAccountAddress`. Remaining accounts are read
 * from the list of addresses provided under their identifier. Required remaining
 * accounts must be provided, possibly as an empty list, whereas optional ones may
 * be omitted.
 *
 * @example
 * ```ts
 * const accountMetas = await createAccountMetas({
 *     accounts: { authority, signers: [signerA, signerB] },
 *     data: { amount: 42n },
 *     path: [root, program, transfer],
 *     signers: ['authority'],
 * });
 * ```
 */
export async function createAccountMetas<
    TAccounts extends AccountsInput = AccountsInput,
    TData extends DataInput = DataInput,
>({ accounts, data, path, signers = [] }: CreateAccountMetasInput<TAccounts, TData>): Promise<AccountMeta[]> {
    const instruction = getLastNodeFromPath(path);
    assertValidAccountAddresses(instruction, accounts);

    const programAddress = getInstructionProgramAddress(path);
    const accountMetas = await Promise.all(
        (instruction.accounts ?? []).map(async account => {
            const address = await resolveInstructionAccountAddress({
                accountsInput: accounts,
                dataInput: data,
                path: [...path, account],
            });
            if (address === null) return null;

            // Optional accounts resolved to the program address via the `programId` strategy
            // cannot be writable on-chain, so they are downgraded to readonly.
            const input = accounts?.[account.identifier];
            const isResolvedToProgramId =
                account.isOptional &&
                (input === undefined || input === null) &&
                (instruction.optionalAccountStrategy ?? 'programId') === 'programId' &&
                address === programAddress;
            const isSigner = isSignerAccount(account, signers);
            const role = getAccountRole(isSigner, !isResolvedToProgramId && Boolean(account.isWritable));
            return { address, role } satisfies AccountMeta;
        }),
    );

    const remainingAccountMetas = (instruction.remainingAccounts ?? []).flatMap(remainingAccounts =>
        getRemainingAccountMetas(instruction, remainingAccounts, accounts),
    );

    return [...accountMetas.filter(meta => meta !== null), ...remainingAccountMetas];
}

/** Ensure the provided addresses of the named accounts of the instruction are valid. */
function assertValidAccountAddresses(instruction: InstructionNode, accounts: AccountsInput | undefined): void {
    for (const account of instruction.accounts ?? []) {
        const input = accounts?.[account.identifier];
        // Lists are rejected when resolving the account, as only remaining accounts accept them.
        if (input === undefined || input === null || Array.isArray(input) || isAddressConvertible(input)) continue;
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ACCOUNT_ADDRESS, {
            accountName: account.identifier,
            value: safeStringify(input),
        });
    }
}

function getRemainingAccountMetas(
    instruction: InstructionNode,
    remainingAccounts: InstructionRemainingAccountsNode,
    accounts: AccountsInput | undefined,
): AccountMeta[] {
    const accountName = remainingAccounts.identifier;
    const addresses = accounts?.[accountName];
    if (addresses === undefined) {
        if (remainingAccounts.isOptional) return [];
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING, {
            accountName,
            instructionName: instruction.identifier,
        });
    }
    if (!Array.isArray(addresses)) {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__INVALID_ACCOUNT_INPUT, {
            accountName,
            expectedType: 'Address[]',
            value: safeStringify(addresses),
        });
    }

    // TODO: 'either' is treated as signer — this works for Token Program multisig signers,
    // but may need refinement for programs where 'either' accounts are sometimes non-signers.
    const isSigner = remainingAccounts.isSigner === true || remainingAccounts.isSigner === 'either';
    const role = getAccountRole(isSigner, Boolean(remainingAccounts.isWritable));
    return (addresses as unknown[]).map((address, index): AccountMeta => ({
        address: toAddressOrThrow(address, `${accountName}[${index}]`),
        role,
    }));
}

function isSignerAccount(account: InstructionAccountNode, signers: EitherSigners): boolean {
    if (account.isSigner === 'either') return signers.includes(account.identifier);
    return account.isSigner === true;
}

function getAccountRole(isSigner: boolean, isWritable: boolean): AccountRole {
    if (isWritable && isSigner) return AccountRole.WRITABLE_SIGNER;
    if (isWritable) return AccountRole.WRITABLE;
    if (isSigner) return AccountRole.READONLY_SIGNER;
    return AccountRole.READONLY;
}
