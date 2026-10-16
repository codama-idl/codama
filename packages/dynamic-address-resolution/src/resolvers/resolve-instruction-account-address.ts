import {
    CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION,
    CodamaError,
} from '@codama/errors';
import type { Address } from '@solana/addresses';
import {
    getLastNodeFromPath,
    getNodePathUntilLastNode,
    type InstructionAccountNode,
    type LinkableDictionary,
    type NodePath,
} from 'codama';

import { toAddress } from '../shared/address';
import type { AccountsInput, DataInput, FetchAccountsFn } from '../shared/types';
import { createResolutionContext, getAccountInput } from './context';
import { resolveAccountAddress } from './resolve-account-address';

export type ResolveInstructionAccountAddressInput<
    TAccounts extends AccountsInput = AccountsInput,
    TData extends DataInput = DataInput,
> = {
    accountsInput?: TAccounts;
    dataInput?: TData;
    /**
     * Fetches the accounts whose data default values read, e.g. an `accountDataValueNode` or a
     * `dataValueNode` crossing an `accountLink`. Required by instructions reading account data,
     * see `readsAccountData`.
     */
    fetchAccounts?: FetchAccountsFn;
    /**
     * The linkable nodes of the tree, e.g. from `getLinkablesFromNode(root)`, used to follow links.
     * Defaults to recording them from the root of the path: pass them to avoid recording them again.
     */
    linkables?: LinkableDictionary;
    /** The path of the instruction account from the root node, e.g. `[root, program, instruction, account]`. */
    path: NodePath<InstructionAccountNode>;
};

/**
 * Resolve the address of an instruction account: the provided address if
 * any, otherwise its default value or its instruction's optional account
 * strategy.
 *
 * | Account | Input | Resolves to |
 * | --- | --- | --- |
 * | Without default | `undefined` or `null` | throws, unless optional and `null` |
 * | With default | `undefined` | its default value |
 * | Optional | `null` | its `optionalAccountStrategy` |
 *
 * Default values reading account data, e.g. `accountDataValueNode('mint', { path: 'mintAuthority' })`,
 * fetch these accounts with `fetchAccounts` and decode them using their `accountLink`.
 *
 * @example
 * ```ts
 * const address = await resolveInstructionAccountAddress({
 *     accountsInput: { authority },
 *     dataInput: { amount: 42n },
 *     path: [root, root.program, instruction, vaultAccount],
 * });
 * ```
 */
export async function resolveInstructionAccountAddress<
    TAccounts extends AccountsInput = AccountsInput,
    TData extends DataInput = DataInput,
>({
    accountsInput,
    dataInput,
    fetchAccounts,
    linkables,
    path,
}: ResolveInstructionAccountAddressInput<TAccounts, TData>): Promise<Address | null> {
    const ixAccountNode = getLastNodeFromPath(path);
    const instructionPath = getNodePathUntilLastNode(path, 'instructionNode');
    if (!instructionPath) {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION, {
            message: `The path of account [${ixAccountNode.identifier}] must include its instruction.`,
        });
    }

    const addressInput = getAccountInput({ accountsInput }, ixAccountNode.identifier);
    if (addressInput !== undefined && addressInput !== null) {
        return toAddress(addressInput);
    }

    const canAutoResolve = !!ixAccountNode.defaultValue || (ixAccountNode.isOptional && addressInput === null);
    if (!canAutoResolve) {
        throw new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING, { path });
    }

    const ctx = createResolutionContext(instructionPath, { accountsInput, dataInput, fetchAccounts, linkables });
    return await resolveAccountAddress(ixAccountNode, ctx);
}
