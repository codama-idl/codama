import type { AccountsInput, ArgumentsInput, ResolversInput } from '@codama/dynamic-address-resolution';
import type { Instruction } from '@solana/instructions';

type AccountName = string;
export type EitherSigners = AccountName[];

type TBuildIxFn<TInstruction> = (
    argumentsInput?: ArgumentsInput,
    accountsInput?: AccountsInput,
    signers?: EitherSigners,
    resolversInput?: ResolversInput,
) => Promise<TInstruction>;
export type BuildIxFn = TBuildIxFn<Instruction>;
