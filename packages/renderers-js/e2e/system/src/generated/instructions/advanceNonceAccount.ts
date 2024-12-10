/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  combineCodec,
  getStructDecoder,
  getStructEncoder,
  getU32Decoder,
  getU32Encoder,
  transformEncoder,
  type Address,
  type Codec,
  type Decoder,
  type Encoder,
  type IAccountMeta,
  type IAccountSignerMeta,
  type IInstruction,
  type IInstructionWithAccounts,
  type IInstructionWithData,
  type ReadonlyAccount,
  type ReadonlySignerAccount,
  type ReadonlyUint8Array,
  type TransactionSigner,
  type WritableAccount,
} from '@solana/web3.js';
import { SYSTEM_PROGRAM_ADDRESS } from '../programs';
import { getAccountMetaFactory, type ResolvedAccount } from '../shared';

export const ADVANCE_NONCE_ACCOUNT_DISCRIMINATOR = 4;

export function getAdvanceNonceAccountDiscriminatorBytes() {
  return getU32Encoder().encode(ADVANCE_NONCE_ACCOUNT_DISCRIMINATOR);
}

export type AdvanceNonceAccountInstruction<
  TProgram extends string = typeof SYSTEM_PROGRAM_ADDRESS,
  TAccountNonceAccount extends string | IAccountMeta<string> = string,
  TAccountRecentBlockhashesSysvar extends
    | string
    | IAccountMeta<string> = 'SysvarRecentB1ockHashes11111111111111111111',
  TAccountNonceAuthority extends string | IAccountMeta<string> = string,
  TRemainingAccounts extends readonly IAccountMeta<string>[] = [],
> = IInstruction<TProgram> &
  IInstructionWithData<ReadonlyUint8Array> &
  IInstructionWithAccounts<
    [
      TAccountNonceAccount extends string
        ? WritableAccount<TAccountNonceAccount>
        : TAccountNonceAccount,
      TAccountRecentBlockhashesSysvar extends string
        ? ReadonlyAccount<TAccountRecentBlockhashesSysvar>
        : TAccountRecentBlockhashesSysvar,
      TAccountNonceAuthority extends string
        ? ReadonlySignerAccount<TAccountNonceAuthority> &
            IAccountSignerMeta<TAccountNonceAuthority>
        : TAccountNonceAuthority,
      ...TRemainingAccounts,
    ]
  >;

export type AdvanceNonceAccountInstructionData = { discriminator: number };

export type AdvanceNonceAccountInstructionDataArgs = {};

export function getAdvanceNonceAccountInstructionDataEncoder(): Encoder<AdvanceNonceAccountInstructionDataArgs> {
  return transformEncoder(
    getStructEncoder([['discriminator', getU32Encoder()]]),
    (value) => ({
      ...value,
      discriminator: ADVANCE_NONCE_ACCOUNT_DISCRIMINATOR,
    })
  );
}

export function getAdvanceNonceAccountInstructionDataDecoder(): Decoder<AdvanceNonceAccountInstructionData> {
  return getStructDecoder([['discriminator', getU32Decoder()]]);
}

export function getAdvanceNonceAccountInstructionDataCodec(): Codec<
  AdvanceNonceAccountInstructionDataArgs,
  AdvanceNonceAccountInstructionData
> {
  return combineCodec(
    getAdvanceNonceAccountInstructionDataEncoder(),
    getAdvanceNonceAccountInstructionDataDecoder()
  );
}

export type AdvanceNonceAccountInput<
  TAccountNonceAccount extends string = string,
  TAccountRecentBlockhashesSysvar extends string = string,
  TAccountNonceAuthority extends string = string,
> = {
  nonceAccount: Address<TAccountNonceAccount>;
  recentBlockhashesSysvar?: Address<TAccountRecentBlockhashesSysvar>;
  nonceAuthority: TransactionSigner<TAccountNonceAuthority>;
};

export function getAdvanceNonceAccountInstruction<
  TAccountNonceAccount extends string,
  TAccountRecentBlockhashesSysvar extends string,
  TAccountNonceAuthority extends string,
  TProgramAddress extends Address = typeof SYSTEM_PROGRAM_ADDRESS,
>(
  input: AdvanceNonceAccountInput<
    TAccountNonceAccount,
    TAccountRecentBlockhashesSysvar,
    TAccountNonceAuthority
  >,
  config?: { programAddress?: TProgramAddress }
): AdvanceNonceAccountInstruction<
  TProgramAddress,
  TAccountNonceAccount,
  TAccountRecentBlockhashesSysvar,
  TAccountNonceAuthority
> {
  // Program address.
  const programAddress = config?.programAddress ?? SYSTEM_PROGRAM_ADDRESS;

  // Original accounts.
  const originalAccounts = {
    nonceAccount: { value: input.nonceAccount ?? null, isWritable: true },
    recentBlockhashesSysvar: {
      value: input.recentBlockhashesSysvar ?? null,
      isWritable: false,
    },
    nonceAuthority: { value: input.nonceAuthority ?? null, isWritable: false },
  };
  const accounts = originalAccounts as Record<
    keyof typeof originalAccounts,
    ResolvedAccount
  >;

  // Resolve default values.
  if (!accounts.recentBlockhashesSysvar.value) {
    accounts.recentBlockhashesSysvar.value =
      'SysvarRecentB1ockHashes11111111111111111111' as Address<'SysvarRecentB1ockHashes11111111111111111111'>;
  }

  const getAccountMeta = getAccountMetaFactory(programAddress, 'programId');
  const instruction = {
    accounts: [
      getAccountMeta(accounts.nonceAccount),
      getAccountMeta(accounts.recentBlockhashesSysvar),
      getAccountMeta(accounts.nonceAuthority),
    ],
    programAddress,
    data: getAdvanceNonceAccountInstructionDataEncoder().encode({}),
  } as AdvanceNonceAccountInstruction<
    TProgramAddress,
    TAccountNonceAccount,
    TAccountRecentBlockhashesSysvar,
    TAccountNonceAuthority
  >;

  return instruction;
}

export type ParsedAdvanceNonceAccountInstruction<
  TProgram extends string = typeof SYSTEM_PROGRAM_ADDRESS,
  TAccountMetas extends readonly IAccountMeta[] = readonly IAccountMeta[],
> = {
  programAddress: Address<TProgram>;
  accounts: {
    nonceAccount: TAccountMetas[0];
    recentBlockhashesSysvar: TAccountMetas[1];
    nonceAuthority: TAccountMetas[2];
  };
  data: AdvanceNonceAccountInstructionData;
};

export function parseAdvanceNonceAccountInstruction<
  TProgram extends string,
  TAccountMetas extends readonly IAccountMeta[],
>(
  instruction: IInstruction<TProgram> &
    IInstructionWithAccounts<TAccountMetas> &
    IInstructionWithData<ReadonlyUint8Array>
): ParsedAdvanceNonceAccountInstruction<TProgram, TAccountMetas> {
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
      nonceAccount: getNextAccount(),
      recentBlockhashesSysvar: getNextAccount(),
      nonceAuthority: getNextAccount(),
    },
    data: getAdvanceNonceAccountInstructionDataDecoder().decode(
      instruction.data
    ),
  };
}
