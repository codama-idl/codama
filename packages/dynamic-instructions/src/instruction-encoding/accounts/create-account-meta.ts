import type { Address } from '@solana/addresses';
import type { AccountMeta } from '@solana/instructions';
import { AccountRole } from '@solana/instructions';
import type { InstructionAccountNode, InstructionNode, RootNode } from 'codama';

import { isConvertibleAddress, toAddress } from '../../shared/address';
import { AccountError } from '../../shared/errors';
import type { AccountsInput, ArgumentsInput, EitherSigners, ResolversInput } from '../../shared/types';
import { formatValueType } from '../../shared/util';
import { resolveAccountAddress } from '../resolvers/resolve-account-address';

type ResolvedAccount = {
    address: Address | null;
    optional: boolean;
    role: AccountRole;
};

type ResolvedAccountWithAddress = ResolvedAccount & { address: Address };

/**
 * Resolves account addresses and creates AccountMeta for each account in the instruction by evaluating their default values.
 * Handles optional accounts based on the instruction's optionalAccountStrategy.
 * Throws errors if required accounts are missing or cannot be resolved.
 */
export async function createAccountMeta(
    root: RootNode,
    ixNode: InstructionNode,
    argumentsInput: ArgumentsInput = {},
    accountsInput: AccountsInput = {},
    signers: EitherSigners = [],
    resolversInput: ResolversInput = {},
): Promise<AccountMeta[]> {
    const resolvedAccounts = await Promise.all(
        ixNode.accounts.map<Promise<ResolvedAccount>>(async ixAccountNode => {
            const accountAddressInput = accountsInput?.[ixAccountNode.name];

            const isAccountProvided = accountAddressInput !== undefined && accountAddressInput !== null;
            // Accounts with default values can be omitted, as they can be resolved from default value
            if (!isAccountProvided && !ixAccountNode.isOptional && !ixAccountNode.defaultValue) {
                throw new AccountError(`Missing required account: ${ixAccountNode.name}`);
            }

            let resolvedAccountAddress: Address | null = null;
            if (!isAccountProvided) {
                resolvedAccountAddress = await resolveAccountAddress({
                    accountAddressInput,
                    accountsInput,
                    argumentsInput,
                    ixAccountNode,
                    ixNode,
                    resolutionPath: [],
                    resolversInput,
                    root,
                });
            }

            return {
                address: isAccountProvided ? toAddress(accountAddressInput) : resolvedAccountAddress,
                optional: Boolean(ixAccountNode.isOptional),
                role: getAccountRole(ixAccountNode, signers),
            };
        }),
    );

    const accountMetas: AccountMeta[] = resolvedAccounts
        // Filter out optional accounts with "omitted" strategy (nulls).
        .filter((acc): acc is ResolvedAccountWithAddress => acc.address !== null)
        .map(acc => ({
            address: acc.address,
            role: acc.role,
        }));

    // Resolve remaining accounts from argument values
    // https://github.com/codama-idl/codama/blob/main/packages/nodes/docs/InstructionRemainingAccountsNode.md
    for (const remainingNode of ixNode.remainingAccounts ?? []) {
        if (remainingNode.value.kind !== 'argumentValueNode') {
            throw new AccountError(`Unsupported remaining accounts value kind: "${remainingNode.value.kind}"`);
        }
        const addresses = argumentsInput[remainingNode.value.name];

        if (addresses === undefined) {
            // Required remaining accounts must be provided.
            if (!remainingNode.isOptional) {
                throw new AccountError(
                    `Remaining account argument "${remainingNode.value.name}" is required but was not provided`,
                );
            }
            // Optional remaining accounts can be safely omitted.
            continue;
        }

        if (!Array.isArray(addresses)) {
            throw new AccountError(
                `Remaining account argument "${remainingNode.value.name}" must be an array of addresses`,
            );
        }
        const role = getRemainingAccountRole(remainingNode.isSigner, remainingNode.isWritable);
        for (let i = 0; i < addresses.length; i++) {
            const addr: unknown = addresses[i];
            if (!isConvertibleAddress(addr)) {
                throw new AccountError(
                    `Remaining account argument "${remainingNode.value.name}[${i}]" must be an address string or PublicKey, got ${formatValueType(addr)}`,
                );
            }
            accountMetas.push({ address: toAddress(addr), role });
        }
    }

    return accountMetas;
}

// TODO: 'either' is treated as signer — this works for Token Program multisig signers,
// but may need refinement for programs where 'either' accounts are sometimes non-signers.
function getRemainingAccountRole(isSigner?: boolean | 'either', isWritable?: boolean): AccountRole {
    const signer = isSigner === true || isSigner === 'either';
    const writable = isWritable === true;
    if (writable && signer) return AccountRole.WRITABLE_SIGNER;
    if (writable) return AccountRole.WRITABLE;
    if (signer) return AccountRole.READONLY_SIGNER;
    return AccountRole.READONLY;
}

function getAccountRole(acc: InstructionAccountNode, signers: string[] | undefined): AccountRole {
    const isSigner = isSignerAccount(acc, signers ?? []);
    if (acc.isWritable && isSigner) {
        return AccountRole.WRITABLE_SIGNER;
    }
    if (acc.isWritable) {
        return AccountRole.WRITABLE;
    }
    if (isSigner) {
        return AccountRole.READONLY_SIGNER;
    }
    return AccountRole.READONLY;
}

function isSignerAccount(acc: InstructionAccountNode, signers: string[]) {
    if (acc.isSigner === 'either') {
        return signers.includes(acc.name);
    }
    return acc.isSigner === true;
}
