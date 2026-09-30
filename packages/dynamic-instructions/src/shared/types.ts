import type { AccountsInput, DataInput } from '@codama/dynamic-address-resolution';
import type { Instruction } from '@solana/instructions';

type AccountName = string;

/** The accounts with `isSigner: 'either'` to mark as signers, e.g. `['owner']`. */
export type EitherSigners = AccountName[];

/** The inputs of an instruction, as accepted by {@link InstructionsBuilderFn}. */
export type InstructionInput<
    TData extends DataInput = DataInput,
    TAccounts extends AccountsInput = AccountsInput,
    TSigners extends EitherSigners = EitherSigners,
> = {
    /**
     * The addresses of the accounts, keyed by account identifier, e.g. `{ payer: '111..' }`.
     * Remaining accounts are provided as lists of addresses, e.g. `{ signers: [a, b] }`.
     */
    accounts?: TAccounts;
    /** The instruction data, as accepted by its codec, e.g. `{ amount: 1_000_000_000n }`. */
    data?: TData;
    /** The accounts with `isSigner: 'either'` to mark as signers. */
    signers?: TSigners;
};

/** Build an `Instruction` from the given inputs, see `createInstructionsBuilder`. */
export type InstructionsBuilderFn<
    TData extends DataInput = DataInput,
    TAccounts extends AccountsInput = AccountsInput,
    TSigners extends EitherSigners = EitherSigners,
> = (input?: InstructionInput<TData, TAccounts, TSigners>) => Promise<Instruction>;
