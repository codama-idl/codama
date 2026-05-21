import type {
    AccountsInput,
    ArgumentsInput,
    ResolverFnInput,
    ResolversInput,
} from '@codama/dynamic-address-resolution';
import type { Instruction } from '@solana/instructions';

type AccountName = string;
export type EitherSigners = AccountName[];

export type InstructionsBuilderFn<
    TArgs extends ArgumentsInput = ArgumentsInput,
    TAccounts extends AccountsInput = AccountsInput,
    TSigners extends EitherSigners = EitherSigners,
    TResolvers extends ResolverFnInput = ResolversInput,
> = (
    /** Instruction argument values (e.g. `{ amount: 1_000_000_000 }`). */
    argumentsInput?: TArgs,
    /** Account addresses keyed by name  (e.g. `{ payer: '111..' }`). */
    accountsInput?: TAccounts,
    /** Account names to mark as signers when the account has ambiguous `isSigner: 'either'`. */
    signers?: TSigners,
    /** Custom resolver functions for arguments with `ResolverValueNode`. */
    resolversInput?: TResolvers,
) => Promise<Instruction>;
