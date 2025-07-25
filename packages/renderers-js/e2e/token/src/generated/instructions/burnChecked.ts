/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  AccountRole,
  combineCodec,
  getStructDecoder,
  getStructEncoder,
  getU64Decoder,
  getU64Encoder,
  getU8Decoder,
  getU8Encoder,
  transformEncoder,
  type AccountMeta,
  type AccountSignerMeta,
  type Address,
  type FixedSizeCodec,
  type FixedSizeDecoder,
  type FixedSizeEncoder,
  type Instruction,
  type InstructionWithAccounts,
  type InstructionWithData,
  type ReadonlyAccount,
  type ReadonlySignerAccount,
  type ReadonlyUint8Array,
  type TransactionSigner,
  type WritableAccount,
} from '@solana/kit';
import { TOKEN_PROGRAM_ADDRESS } from '../programs';
import { getAccountMetaFactory, type ResolvedAccount } from '../shared';

export const BURN_CHECKED_DISCRIMINATOR = 15;

export function getBurnCheckedDiscriminatorBytes() {
  return getU8Encoder().encode(BURN_CHECKED_DISCRIMINATOR);
}

export type BurnCheckedInstruction<
  TProgram extends string = typeof TOKEN_PROGRAM_ADDRESS,
  TAccountAccount extends string | AccountMeta<string> = string,
  TAccountMint extends string | AccountMeta<string> = string,
  TAccountAuthority extends string | AccountMeta<string> = string,
  TRemainingAccounts extends readonly AccountMeta<string>[] = [],
> = Instruction<TProgram> &
  InstructionWithData<ReadonlyUint8Array> &
  InstructionWithAccounts<
    [
      TAccountAccount extends string
        ? WritableAccount<TAccountAccount>
        : TAccountAccount,
      TAccountMint extends string
        ? WritableAccount<TAccountMint>
        : TAccountMint,
      TAccountAuthority extends string
        ? ReadonlyAccount<TAccountAuthority>
        : TAccountAuthority,
      ...TRemainingAccounts,
    ]
  >;

export type BurnCheckedInstructionData = {
  discriminator: number;
  /** The amount of tokens to burn. */
  amount: bigint;
  /** Expected number of base 10 digits to the right of the decimal place. */
  decimals: number;
};

export type BurnCheckedInstructionDataArgs = {
  /** The amount of tokens to burn. */
  amount: number | bigint;
  /** Expected number of base 10 digits to the right of the decimal place. */
  decimals: number;
};

export function getBurnCheckedInstructionDataEncoder(): FixedSizeEncoder<BurnCheckedInstructionDataArgs> {
  return transformEncoder(
    getStructEncoder([
      ['discriminator', getU8Encoder()],
      ['amount', getU64Encoder()],
      ['decimals', getU8Encoder()],
    ]),
    (value) => ({ ...value, discriminator: BURN_CHECKED_DISCRIMINATOR })
  );
}

export function getBurnCheckedInstructionDataDecoder(): FixedSizeDecoder<BurnCheckedInstructionData> {
  return getStructDecoder([
    ['discriminator', getU8Decoder()],
    ['amount', getU64Decoder()],
    ['decimals', getU8Decoder()],
  ]);
}

export function getBurnCheckedInstructionDataCodec(): FixedSizeCodec<
  BurnCheckedInstructionDataArgs,
  BurnCheckedInstructionData
> {
  return combineCodec(
    getBurnCheckedInstructionDataEncoder(),
    getBurnCheckedInstructionDataDecoder()
  );
}

export type BurnCheckedInput<
  TAccountAccount extends string = string,
  TAccountMint extends string = string,
  TAccountAuthority extends string = string,
> = {
  /** The account to burn from. */
  account: Address<TAccountAccount>;
  /** The token mint. */
  mint: Address<TAccountMint>;
  /** The account's owner/delegate or its multisignature account. */
  authority: Address<TAccountAuthority> | TransactionSigner<TAccountAuthority>;
  amount: BurnCheckedInstructionDataArgs['amount'];
  decimals: BurnCheckedInstructionDataArgs['decimals'];
  multiSigners?: Array<TransactionSigner>;
};

export function getBurnCheckedInstruction<
  TAccountAccount extends string,
  TAccountMint extends string,
  TAccountAuthority extends string,
  TProgramAddress extends Address = typeof TOKEN_PROGRAM_ADDRESS,
>(
  input: BurnCheckedInput<TAccountAccount, TAccountMint, TAccountAuthority>,
  config?: { programAddress?: TProgramAddress }
): BurnCheckedInstruction<
  TProgramAddress,
  TAccountAccount,
  TAccountMint,
  (typeof input)['authority'] extends TransactionSigner<TAccountAuthority>
    ? ReadonlySignerAccount<TAccountAuthority> &
        AccountSignerMeta<TAccountAuthority>
    : TAccountAuthority
> {
  // Program address.
  const programAddress = config?.programAddress ?? TOKEN_PROGRAM_ADDRESS;

  // Original accounts.
  const originalAccounts = {
    account: { value: input.account ?? null, isWritable: true },
    mint: { value: input.mint ?? null, isWritable: true },
    authority: { value: input.authority ?? null, isWritable: false },
  };
  const accounts = originalAccounts as Record<
    keyof typeof originalAccounts,
    ResolvedAccount
  >;

  // Original args.
  const args = { ...input };

  // Remaining accounts.
  const remainingAccounts: AccountMeta[] = (args.multiSigners ?? []).map(
    (signer) => ({
      address: signer.address,
      role: AccountRole.READONLY_SIGNER,
      signer,
    })
  );

  const getAccountMeta = getAccountMetaFactory(programAddress, 'programId');
  const instruction = {
    accounts: [
      getAccountMeta(accounts.account),
      getAccountMeta(accounts.mint),
      getAccountMeta(accounts.authority),
      ...remainingAccounts,
    ],
    programAddress,
    data: getBurnCheckedInstructionDataEncoder().encode(
      args as BurnCheckedInstructionDataArgs
    ),
  } as BurnCheckedInstruction<
    TProgramAddress,
    TAccountAccount,
    TAccountMint,
    (typeof input)['authority'] extends TransactionSigner<TAccountAuthority>
      ? ReadonlySignerAccount<TAccountAuthority> &
          AccountSignerMeta<TAccountAuthority>
      : TAccountAuthority
  >;

  return instruction;
}

export type ParsedBurnCheckedInstruction<
  TProgram extends string = typeof TOKEN_PROGRAM_ADDRESS,
  TAccountMetas extends readonly AccountMeta[] = readonly AccountMeta[],
> = {
  programAddress: Address<TProgram>;
  accounts: {
    /** The account to burn from. */
    account: TAccountMetas[0];
    /** The token mint. */
    mint: TAccountMetas[1];
    /** The account's owner/delegate or its multisignature account. */
    authority: TAccountMetas[2];
  };
  data: BurnCheckedInstructionData;
};

export function parseBurnCheckedInstruction<
  TProgram extends string,
  TAccountMetas extends readonly AccountMeta[],
>(
  instruction: Instruction<TProgram> &
    InstructionWithAccounts<TAccountMetas> &
    InstructionWithData<ReadonlyUint8Array>
): ParsedBurnCheckedInstruction<TProgram, TAccountMetas> {
  if (instruction.accounts.length < 3) {
    // TODO: Coded error.
    throw new Error('Not enough accounts');
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts![accountIndex]!;
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      account: getNextAccount(),
      mint: getNextAccount(),
      authority: getNextAccount(),
    },
    data: getBurnCheckedInstructionDataDecoder().decode(instruction.data),
  };
}
