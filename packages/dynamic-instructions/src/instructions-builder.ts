import type { AccountsInput, DataInput } from '@codama/dynamic-address-resolution';
import type { InstructionNode, NodePath } from 'codama';

import { createAccountMetas } from './accounts';
import { createInstructionDataEncoder } from './data';
import { getInstructionProgramAddress } from './shared/program';
import type { EitherSigners, InstructionsBuilderFn } from './shared/types';

/**
 * Create an async function building the `Instruction` of the instruction at the
 * end of the given path, e.g. `[root, program, instruction]`.
 *
 * The returned function encodes the provided data, resolves the addresses of the
 * accounts that are not provided from their default values, and uses the address
 * of the program defining the instruction.
 *
 * @example
 * ```ts
 * const build = createInstructionsBuilder([root, program, transfer]);
 * const instruction = await build({ accounts: { destination, source }, data: { amount: 42n } });
 * ```
 */
export function createInstructionsBuilder<
    TData extends DataInput = DataInput,
    TAccounts extends AccountsInput = AccountsInput,
    TSigners extends EitherSigners = EitherSigners,
>(path: NodePath<InstructionNode>): InstructionsBuilderFn<TData, TAccounts, TSigners> {
    const programAddress = getInstructionProgramAddress(path);
    const encodeData = createInstructionDataEncoder<TData>(path);

    return async ({ accounts, data, signers } = {}) => {
        const instructionData = encodeData(data);
        const accountMetas = await createAccountMetas({ accounts, data, path, signers });
        return { accounts: accountMetas, data: instructionData, programAddress };
    };
}
