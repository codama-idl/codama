/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama/codama
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
} from '@solana/web3.js';
import { SYSTEM_PROGRAM_ADDRESS } from '../programs';
import { getAccountMetaFactory, type ResolvedAccount } from '../shared';

export const ALLOCATE_WITH_SEED_DISCRIMINATOR = 9;

export function getAllocateWithSeedDiscriminatorBytes() {
  return getU32Encoder().encode(ALLOCATE_WITH_SEED_DISCRIMINATOR);
}

export type AllocateWithSeedInstruction<
  TProgram extends string = typeof SYSTEM_PROGRAM_ADDRESS,
  TAccountNewAccount extends string | IAccountMeta<string> = string,
  TAccountBaseAccount extends string | IAccountMeta<string> = string,
  TRemainingAccounts extends readonly IAccountMeta<string>[] = [],
> = IInstruction<TProgram> &
  IInstructionWithData<Uint8Array> &
  IInstructionWithAccounts<
    [
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

export type AllocateWithSeedInstructionData = {
  discriminator: number;
  base: Address;
  seed: string;
  space: bigint;
  programAddress: Address;
};

export type AllocateWithSeedInstructionDataArgs = {
  base: Address;
  seed: string;
  space: number | bigint;
  programAddress: Address;
};

export function getAllocateWithSeedInstructionDataEncoder(): Encoder<AllocateWithSeedInstructionDataArgs> {
  return transformEncoder(
    getStructEncoder([
      ['discriminator', getU32Encoder()],
      ['base', getAddressEncoder()],
      ['seed', addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder())],
      ['space', getU64Encoder()],
      ['programAddress', getAddressEncoder()],
    ]),
    (value) => ({ ...value, discriminator: ALLOCATE_WITH_SEED_DISCRIMINATOR })
  );
}

export function getAllocateWithSeedInstructionDataDecoder(): Decoder<AllocateWithSeedInstructionData> {
  return getStructDecoder([
    ['discriminator', getU32Decoder()],
    ['base', getAddressDecoder()],
    ['seed', addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
    ['space', getU64Decoder()],
    ['programAddress', getAddressDecoder()],
  ]);
}

export function getAllocateWithSeedInstructionDataCodec(): Codec<
  AllocateWithSeedInstructionDataArgs,
  AllocateWithSeedInstructionData
> {
  return combineCodec(
    getAllocateWithSeedInstructionDataEncoder(),
    getAllocateWithSeedInstructionDataDecoder()
  );
}

export type AllocateWithSeedInput<
  TAccountNewAccount extends string = string,
  TAccountBaseAccount extends string = string,
> = {
  newAccount: Address<TAccountNewAccount>;
  baseAccount: TransactionSigner<TAccountBaseAccount>;
  base: AllocateWithSeedInstructionDataArgs['base'];
  seed: AllocateWithSeedInstructionDataArgs['seed'];
  space: AllocateWithSeedInstructionDataArgs['space'];
  programAddress: AllocateWithSeedInstructionDataArgs['programAddress'];
};

export function getAllocateWithSeedInstruction<
  TAccountNewAccount extends string,
  TAccountBaseAccount extends string,
  TProgramAddress extends Address = typeof SYSTEM_PROGRAM_ADDRESS,
>(
  input: AllocateWithSeedInput<TAccountNewAccount, TAccountBaseAccount>,
  config?: { programAddress?: TProgramAddress }
): AllocateWithSeedInstruction<
  TProgramAddress,
  TAccountNewAccount,
  TAccountBaseAccount
> {
  // Program address.
  const programAddress = config?.programAddress ?? SYSTEM_PROGRAM_ADDRESS;

  // Original accounts.
  const originalAccounts = {
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
      getAccountMeta(accounts.newAccount),
      getAccountMeta(accounts.baseAccount),
    ],
    programAddress,
    data: getAllocateWithSeedInstructionDataEncoder().encode(
      args as AllocateWithSeedInstructionDataArgs
    ),
  } as AllocateWithSeedInstruction<
    TProgramAddress,
    TAccountNewAccount,
    TAccountBaseAccount
  >;

  return instruction;
}

export type ParsedAllocateWithSeedInstruction<
  TProgram extends string = typeof SYSTEM_PROGRAM_ADDRESS,
  TAccountMetas extends readonly IAccountMeta[] = readonly IAccountMeta[],
> = {
  programAddress: Address<TProgram>;
  accounts: {
    newAccount: TAccountMetas[0];
    baseAccount: TAccountMetas[1];
  };
  data: AllocateWithSeedInstructionData;
};

export function parseAllocateWithSeedInstruction<
  TProgram extends string,
  TAccountMetas extends readonly IAccountMeta[],
>(
  instruction: IInstruction<TProgram> &
    IInstructionWithAccounts<TAccountMetas> &
    IInstructionWithData<Uint8Array>
): ParsedAllocateWithSeedInstruction<TProgram, TAccountMetas> {
  if (instruction.accounts.length < 2) {
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
      newAccount: getNextAccount(),
      baseAccount: getNextAccount(),
    },
    data: getAllocateWithSeedInstructionDataDecoder().decode(instruction.data),
  };
}
