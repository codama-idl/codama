import type { Instruction } from '@solana/instructions';

import type { AddressInput } from './address';

// Note: optional accounts may be explicitly set to null.
export type AccountsInput = Partial<Record<string, AddressInput | null>>;
export type ArgumentsInput = Partial<Record<string, unknown>>;
type AccountName = string;
export type EitherSigners = AccountName[];

export type ResolverFn = (argumentsInput: ArgumentsInput, accountsInput: AccountsInput) => Promise<unknown>;
export type ResolversInput = Record<string, ResolverFn>;

type TBuildIxFn<TInstruction> = (
    argumentsInput?: ArgumentsInput,
    accountsInput?: AccountsInput,
    signers?: EitherSigners,
    resolversInput?: ResolversInput,
) => Promise<TInstruction>;
export type BuildIxFn = TBuildIxFn<Instruction>;
