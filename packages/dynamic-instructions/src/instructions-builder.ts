import {
    type AccountsInput,
    type DataInput,
    getBatchedFetchAccounts,
    resolveInstructionDataDefaultValues,
} from '@codama/dynamic-address-resolution';
import type { InstructionNode, NodePath } from 'codama';

import { createAccountMetas } from './accounts';
import { createInstructionDataEncoder } from './data';
import { getInstructionProgramAddress } from './shared/program';
import type { CreateInstructionsBuilderOptions, EitherSigners, InstructionsBuilderFn } from './shared/types';

/**
 * Create an async function building the `Instruction` of the instruction at the
 * end of the given path, e.g. `[root, program, instruction]`.
 *
 * The returned function encodes the provided data, resolves the addresses of the
 * accounts that are not provided from their default values, and uses the address
 * of the program defining the instruction. Default values reading account data,
 * e.g. `accountDataValueNode('mint', { path: 'decimals' })`, fetch these accounts
 * using the `fetchAccounts` option, which `TReadsAccountData` makes required.
 *
 * @example
 * ```ts
 * const build = createInstructionsBuilder([root, program, transferChecked], { fetchAccounts });
 * const instruction = await build({ accounts: { destination, mint, source }, data: { amount: 42n } });
 * ```
 */
export function createInstructionsBuilder<
    TData extends DataInput = DataInput,
    TAccounts extends AccountsInput = AccountsInput,
    TSigners extends EitherSigners = EitherSigners,
    TReadsAccountData extends boolean = boolean,
>(
    path: NodePath<InstructionNode>,
    ...[options]: [TReadsAccountData] extends [true]
        ? [options: CreateInstructionsBuilderOptions<true>]
        : [options?: CreateInstructionsBuilderOptions<TReadsAccountData>]
): InstructionsBuilderFn<TData, TAccounts, TSigners> {
    const programAddress = getInstructionProgramAddress(path);
    const encodeData = createInstructionDataEncoder<TData>(path);
    const { fetchAccounts } = (options ?? {}) as CreateInstructionsBuilderOptions;

    return async ({ accounts, data, signers } = {}) => {
        // Each build gets its own batch and cache of fetched accounts, shared by its data and
        // accounts, which resolve in parallel. Data errors are reported first, as when no
        // account data is read.
        const batchedFetchAccounts = fetchAccounts ? getBatchedFetchAccounts(fetchAccounts) : undefined;
        const [resolvedDefaultValues, accountMetas] = await Promise.allSettled([
            resolveInstructionDataDefaultValues({
                accountsInput: accounts,
                dataInput: data,
                fetchAccounts: batchedFetchAccounts,
                path,
            }),
            createAccountMetas({ accounts, data, fetchAccounts: batchedFetchAccounts, path, signers }),
        ]);
        if (resolvedDefaultValues.status === 'rejected') throw resolvedDefaultValues.reason;
        const instructionData = encodeData(data, { resolvedDefaultValues: resolvedDefaultValues.value });
        if (accountMetas.status === 'rejected') throw accountMetas.reason;
        return { accounts: accountMetas.value, data: instructionData, programAddress };
    };
}
