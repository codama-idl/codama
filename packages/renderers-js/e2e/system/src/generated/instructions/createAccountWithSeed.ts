/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  addDecoderSizePrefix,
  addEncoderSizePrefix,
  combineCodec,
  getAddressDecoder,
  getAddressEncoder,
  getStructDecoder,
  getStructEncoder,
  getU32Decoder,
  getU32Encoder,
  getU64Decoder,
  getU64Encoder,
  getUtf8Decoder,
  getUtf8Encoder,
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
  type ReadonlySignerAccount,
  type TransactionSigner,
  type WritableAccount,
  type WritableSignerAccount,
} from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '../programs';
import { getAccountMetaFactory, type ResolvedAccount } from '../shared';

export const CREATE_ACCOUNT_WITH_SEED_DISCRIMINATOR = 3;

export function getCreateAccountWithSeedDiscriminatorBytes() {
  return getU32Encoder().encode(CREATE_ACCOUNT_WITH_SEED_DISCRIMINATOR);
}

export type CreateAccountWithSeedInstruction<
  TProgram extends string = typeof SYSTEM_PROGRAM_ADDRESS,
  TAccountPayer extends string | IAccountMeta<string> = string,
  TAccountNewAccount extends string | IAccountMeta<string> = string,
  TAccountBaseAccount extends string | IAccountMeta<string> = string,
  TRemainingAccounts extends readonly IAccountMeta<string>[] = [],
> = IInstruction<TProgram> &
  IInstructionWithData<Uint8Array> &
  IInstructionWithAccounts<
    [
      TAccountPayer extends string
        ? WritableSignerAccount<TAccountPayer> &
            IAccountSignerMeta<TAccountPayer>
        : TAccountPayer,
      TAccountNewAccount extends string
        ? WritableAccount<TAccountNewAccount>
        : TAccountNewAccount,
      TAccountBaseAccount extends string
        ? ReadonlySignerAccount<TAccountBaseAccount> &
            IAccountSignerMeta<TAccountBaseAccount>
        : TAccountBaseAccount,
      ...TRemainingAccounts,
    ]
  >;

export type CreateAccountWithSeedInstructionData = {
  discriminator: number;
  base: Address;
  seed: string;
  amount: bigint;
  space: bigint;
  programAddress: Address;
};

export type CreateAccountWithSeedInstructionDataArgs = {
  base: Address;
  seed: string;
  amount: number | bigint;
  space: number | bigint;
  programAddress: Address;
};

export function getCreateAccountWithSeedInstructionDataEncoder(): Encoder<CreateAccountWithSeedInstructionDataArgs> {
  return transformEncoder(
    getStructEncoder([
      ['discriminator', getU32Encoder()],
      ['base', getAddressEncoder()],
      ['seed', addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder())],
      ['amount', getU64Encoder()],
      ['space', getU64Encoder()],
      ['programAddress', getAddressEncoder()],
    ]),
    (value) => ({
      ...value,
      discriminator: CREATE_ACCOUNT_WITH_SEED_DISCRIMINATOR,
    })
  );
}

export function getCreateAccountWithSeedInstructionDataDecoder(): Decoder<CreateAccountWithSeedInstructionData> {
  return getStructDecoder([
    ['discriminator', getU32Decoder()],
    ['base', getAddressDecoder()],
    ['seed', addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
    ['amount', getU64Decoder()],
    ['space', getU64Decoder()],
    ['programAddress', getAddressDecoder()],
  ]);
}

export function getCreateAccountWithSeedInstructionDataCodec(): Codec<
  CreateAccountWithSeedInstructionDataArgs,
  CreateAccountWithSeedInstructionData
> {
  return combineCodec(
    getCreateAccountWithSeedInstructionDataEncoder(),
    getCreateAccountWithSeedInstructionDataDecoder()
  );
}

export type CreateAccountWithSeedInput<
  TAccountPayer extends string = string,
  TAccountNewAccount extends string = string,
  TAccountBaseAccount extends string = string,
> = {
  payer: TransactionSigner<TAccountPayer>;
  newAccount: Address<TAccountNewAccount>;
  baseAccount: TransactionSigner<TAccountBaseAccount>;
  base: CreateAccountWithSeedInstructionDataArgs['base'];
  seed: CreateAccountWithSeedInstructionDataArgs['seed'];
  amount: CreateAccountWithSeedInstructionDataArgs['amount'];
  space: CreateAccountWithSeedInstructionDataArgs['space'];
  programAddress: CreateAccountWithSeedInstructionDataArgs['programAddress'];
};

export function getCreateAccountWithSeedInstruction<
  TAccountPayer extends string,
  TAccountNewAccount extends string,
  TAccountBaseAccount extends string,
  TProgramAddress extends Address = typeof SYSTEM_PROGRAM_ADDRESS,
>(
  input: CreateAccountWithSeedInput<
    TAccountPayer,
    TAccountNewAccount,
    TAccountBaseAccount
  >,
  config?: { programAddress?: TProgramAddress }
): CreateAccountWithSeedInstruction<
  TProgramAddress,
  TAccountPayer,
  TAccountNewAccount,
  TAccountBaseAccount
> {
  // Program address.
  const programAddress = config?.programAddress ?? SYSTEM_PROGRAM_ADDRESS;

  // Original accounts.
  const originalAccounts = {
    payer: { value: input.payer ?? null, isWritable: true },
    newAccount: { value: input.newAccount ?? null, isWritable: true },
    baseAccount: { value: input.baseAccount ?? null, isWritable: false },
  };
  const accounts = originalAccounts as Record<
    keyof typeof originalAccounts,
    ResolvedAccount
  >;

  // Original args.
  const args = { ...input };

  const getAccountMeta = getAccountMetaFactory(programAddress, 'programId');
  const instruction = {
    accounts: [
      getAccountMeta(accounts.payer),
      getAccountMeta(accounts.newAccount),
      getAccountMeta(accounts.baseAccount),
    ],
    programAddress,
    data: getCreateAccountWithSeedInstructionDataEncoder().encode(
      args as CreateAccountWithSeedInstructionDataArgs
    ),
  } as CreateAccountWithSeedInstruction<
    TProgramAddress,
    TAccountPayer,
    TAccountNewAccount,
    TAccountBaseAccount
  >;

  return instruction;
}

export type ParsedCreateAccountWithSeedInstruction<
  TProgram extends string = typeof SYSTEM_PROGRAM_ADDRESS,
  TAccountMetas extends readonly IAccountMeta[] = readonly IAccountMeta[],
> = {
  programAddress: Address<TProgram>;
  accounts: {
    payer: TAccountMetas[0];
    newAccount: TAccountMetas[1];
    baseAccount: TAccountMetas[2];
  };
  data: CreateAccountWithSeedInstructionData;
};

export function parseCreateAccountWithSeedInstruction<
  TProgram extends string,
  TAccountMetas extends readonly IAccountMeta[],
>(
  instruction: IInstruction<TProgram> &
    IInstructionWithAccounts<TAccountMetas> &
    IInstructionWithData<Uint8Array>
): ParsedCreateAccountWithSeedInstruction<TProgram, TAccountMetas> {
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
      payer: getNextAccount(),
      newAccount: getNextAccount(),
      baseAccount: getNextAccount(),
    },
    data: getCreateAccountWithSeedInstructionDataDecoder().decode(
      instruction.data
    ),
  };
}
