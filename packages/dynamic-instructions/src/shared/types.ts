import type { AccountsInput, DataInput, FetchAccountsFn } from '@codama/dynamic-address-resolution';
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

/**
 * The options of `createInstructionsBuilder`. `fetchAccounts` is required when
 * `TReadsAccountData` is `true`, i.e. when building the instruction reads account data, as
 * reported by `readsAccountData` from `@codama/dynamic-address-resolution`.
 */
export type CreateInstructionsBuilderOptions<TReadsAccountData extends boolean = boolean> = [
    TReadsAccountData,
] extends [true]
    ? FetchAccountsOption
    : Partial<FetchAccountsOption>;

type FetchAccountsOption = {
    /**
     * Fetches the accounts whose data default values read, e.g. a mint for the `decimals`
     * injected into the data of `transferChecked`. Each build fetches every account it reads
     * once, batching the accounts it requests together.
     */
    fetchAccounts: FetchAccountsFn;
};
