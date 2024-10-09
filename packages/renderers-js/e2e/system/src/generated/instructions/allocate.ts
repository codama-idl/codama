/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama/codama
 */

import {
  combineCodec,
  getStructDecoder,
  getStructEncoder,
  getU32Decoder,
  getU32Encoder,
  getU64Decoder,
  getU64Encoder,
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
  type TransactionSigner,
  type WritableSignerAccount,
} from '@solana/web3.js';
import { SYSTEM_PROGRAM_ADDRESS } from '../programs';
import { getAccountMetaFactory, type ResolvedAccount } from '../shared';

export const ALLOCATE_DISCRIMINATOR = 8;

export function getAllocateDiscriminatorBytes() {
  return getU32Encoder().encode(ALLOCATE_DISCRIMINATOR);
}

export type AllocateInstruction<
  TProgram extends string = typeof SYSTEM_PROGRAM_ADDRESS,
  TAccountNewAccount extends string | IAccountMeta<string> = string,
  TRemainingAccounts extends readonly IAccountMeta<string>[] = [],
> = IInstruction<TProgram> &
  IInstructionWithData<Uint8Array> &
  IInstructionWithAccounts<
    [
      TAccountNewAccount extends string
        ? WritableSignerAccount<TAccountNewAccount> &
            IAccountSignerMeta<TAccountNewAccount>
        : TAccountNewAccount,
      ...TRemainingAccounts,
    ]
  >;

export type AllocateInstructionData = { discriminator: number; space: bigint };

export type AllocateInstructionDataArgs = { space: number | bigint };

export function getAllocateInstructionDataEncoder(): Encoder<AllocateInstructionDataArgs> {
  return transformEncoder(
    getStructEncoder([
      ['discriminator', getU32Encoder()],
      ['space', getU64Encoder()],
    ]),
    (value) => ({ ...value, discriminator: ALLOCATE_DISCRIMINATOR })
  );
}

export function getAllocateInstructionDataDecoder(): Decoder<AllocateInstructionData> {
  return getStructDecoder([
    ['discriminator', getU32Decoder()],
    ['space', getU64Decoder()],
  ]);
}

export function getAllocateInstructionDataCodec(): Codec<
  AllocateInstructionDataArgs,
  AllocateInstructionData
> {
  return combineCodec(
    getAllocateInstructionDataEncoder(),
    getAllocateInstructionDataDecoder()
  );
}

export type AllocateInput<TAccountNewAccount extends string = string> = {
  newAccount: TransactionSigner<TAccountNewAccount>;
  space: AllocateInstructionDataArgs['space'];
};

export function getAllocateInstruction<
  TAccountNewAccount extends string,
  TProgramAddress extends Address = typeof SYSTEM_PROGRAM_ADDRESS,
>(
  input: AllocateInput<TAccountNewAccount>,
  config?: { programAddress?: TProgramAddress }
): AllocateInstruction<TProgramAddress, TAccountNewAccount> {
  // Program address.
  const programAddress = config?.programAddress ?? SYSTEM_PROGRAM_ADDRESS;

  // Original accounts.
  const originalAccounts = {
    newAccount: { value: input.newAccount ?? null, isWritable: true },
  };
  const accounts = originalAccounts as Record<
    keyof typeof originalAccounts,
    ResolvedAccount
  >;

  // Original args.
  const args = { ...input };

  const getAccountMeta = getAccountMetaFactory(programAddress, 'programId');
  const instruction = {
    accounts: [getAccountMeta(accounts.newAccount)],
    programAddress,
    data: getAllocateInstructionDataEncoder().encode(
      args as AllocateInstructionDataArgs
    ),
  } as AllocateInstruction<TProgramAddress, TAccountNewAccount>;

  return instruction;
}

export type ParsedAllocateInstruction<
  TProgram extends string = typeof SYSTEM_PROGRAM_ADDRESS,
  TAccountMetas extends readonly IAccountMeta[] = readonly IAccountMeta[],
> = {
  programAddress: Address<TProgram>;
  accounts: {
    newAccount: TAccountMetas[0];
  };
  data: AllocateInstructionData;
};

export function parseAllocateInstruction<
  TProgram extends string,
  TAccountMetas extends readonly IAccountMeta[],
>(
  instruction: IInstruction<TProgram> &
    IInstructionWithAccounts<TAccountMetas> &
    IInstructionWithData<Uint8Array>
): ParsedAllocateInstruction<TProgram, TAccountMetas> {
  if (instruction.accounts.length < 1) {
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
    },
    data: getAllocateInstructionDataDecoder().decode(instruction.data),
  };
}
