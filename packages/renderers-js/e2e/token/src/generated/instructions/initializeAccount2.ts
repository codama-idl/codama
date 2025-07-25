/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  combineCodec,
  getAddressDecoder,
  getAddressEncoder,
  getStructDecoder,
  getStructEncoder,
  getU8Decoder,
  getU8Encoder,
  transformEncoder,
  type AccountMeta,
  type Address,
  type FixedSizeCodec,
  type FixedSizeDecoder,
  type FixedSizeEncoder,
  type Instruction,
  type InstructionWithAccounts,
  type InstructionWithData,
  type ReadonlyAccount,
  type ReadonlyUint8Array,
  type WritableAccount,
} from '@solana/kit';
import { TOKEN_PROGRAM_ADDRESS } from '../programs';
import { getAccountMetaFactory, type ResolvedAccount } from '../shared';

export const INITIALIZE_ACCOUNT2_DISCRIMINATOR = 16;

export function getInitializeAccount2DiscriminatorBytes() {
  return getU8Encoder().encode(INITIALIZE_ACCOUNT2_DISCRIMINATOR);
}

export type InitializeAccount2Instruction<
  TProgram extends string = typeof TOKEN_PROGRAM_ADDRESS,
  TAccountAccount extends string | AccountMeta<string> = string,
  TAccountMint extends string | AccountMeta<string> = string,
  TAccountRent extends
    | string
    | AccountMeta<string> = 'SysvarRent111111111111111111111111111111111',
  TRemainingAccounts extends readonly AccountMeta<string>[] = [],
> = Instruction<TProgram> &
  InstructionWithData<ReadonlyUint8Array> &
  InstructionWithAccounts<
    [
      TAccountAccount extends string
        ? WritableAccount<TAccountAccount>
        : TAccountAccount,
      TAccountMint extends string
        ? ReadonlyAccount<TAccountMint>
        : TAccountMint,
      TAccountRent extends string
        ? ReadonlyAccount<TAccountRent>
        : TAccountRent,
      ...TRemainingAccounts,
    ]
  >;

export type InitializeAccount2InstructionData = {
  discriminator: number;
  /** The new account's owner/multisignature. */
  owner: Address;
};

export type InitializeAccount2InstructionDataArgs = {
  /** The new account's owner/multisignature. */
  owner: Address;
};

export function getInitializeAccount2InstructionDataEncoder(): FixedSizeEncoder<InitializeAccount2InstructionDataArgs> {
  return transformEncoder(
    getStructEncoder([
      ['discriminator', getU8Encoder()],
      ['owner', getAddressEncoder()],
    ]),
    (value) => ({ ...value, discriminator: INITIALIZE_ACCOUNT2_DISCRIMINATOR })
  );
}

export function getInitializeAccount2InstructionDataDecoder(): FixedSizeDecoder<InitializeAccount2InstructionData> {
  return getStructDecoder([
    ['discriminator', getU8Decoder()],
    ['owner', getAddressDecoder()],
  ]);
}

export function getInitializeAccount2InstructionDataCodec(): FixedSizeCodec<
  InitializeAccount2InstructionDataArgs,
  InitializeAccount2InstructionData
> {
  return combineCodec(
    getInitializeAccount2InstructionDataEncoder(),
    getInitializeAccount2InstructionDataDecoder()
  );
}

export type InitializeAccount2Input<
  TAccountAccount extends string = string,
  TAccountMint extends string = string,
  TAccountRent extends string = string,
> = {
  /** The account to initialize. */
  account: Address<TAccountAccount>;
  /** The mint this account will be associated with. */
  mint: Address<TAccountMint>;
  /** Rent sysvar. */
  rent?: Address<TAccountRent>;
  owner: InitializeAccount2InstructionDataArgs['owner'];
};

export function getInitializeAccount2Instruction<
  TAccountAccount extends string,
  TAccountMint extends string,
  TAccountRent extends string,
  TProgramAddress extends Address = typeof TOKEN_PROGRAM_ADDRESS,
>(
  input: InitializeAccount2Input<TAccountAccount, TAccountMint, TAccountRent>,
  config?: { programAddress?: TProgramAddress }
): InitializeAccount2Instruction<
  TProgramAddress,
  TAccountAccount,
  TAccountMint,
  TAccountRent
> {
  // Program address.
  const programAddress = config?.programAddress ?? TOKEN_PROGRAM_ADDRESS;

  // Original accounts.
  const originalAccounts = {
    account: { value: input.account ?? null, isWritable: true },
    mint: { value: input.mint ?? null, isWritable: false },
    rent: { value: input.rent ?? null, isWritable: false },
  };
  const accounts = originalAccounts as Record<
    keyof typeof originalAccounts,
    ResolvedAccount
  >;

  // Original args.
  const args = { ...input };

  // Resolve default values.
  if (!accounts.rent.value) {
    accounts.rent.value =
      'SysvarRent111111111111111111111111111111111' as Address<'SysvarRent111111111111111111111111111111111'>;
  }

  const getAccountMeta = getAccountMetaFactory(programAddress, 'programId');
  const instruction = {
    accounts: [
      getAccountMeta(accounts.account),
      getAccountMeta(accounts.mint),
      getAccountMeta(accounts.rent),
    ],
    programAddress,
    data: getInitializeAccount2InstructionDataEncoder().encode(
      args as InitializeAccount2InstructionDataArgs
    ),
  } as InitializeAccount2Instruction<
    TProgramAddress,
    TAccountAccount,
    TAccountMint,
    TAccountRent
  >;

  return instruction;
}

export type ParsedInitializeAccount2Instruction<
  TProgram extends string = typeof TOKEN_PROGRAM_ADDRESS,
  TAccountMetas extends readonly AccountMeta[] = readonly AccountMeta[],
> = {
  programAddress: Address<TProgram>;
  accounts: {
    /** The account to initialize. */
    account: TAccountMetas[0];
    /** The mint this account will be associated with. */
    mint: TAccountMetas[1];
    /** Rent sysvar. */
    rent: TAccountMetas[2];
  };
  data: InitializeAccount2InstructionData;
};

export function parseInitializeAccount2Instruction<
  TProgram extends string,
  TAccountMetas extends readonly AccountMeta[],
>(
  instruction: Instruction<TProgram> &
    InstructionWithAccounts<TAccountMetas> &
    InstructionWithData<ReadonlyUint8Array>
): ParsedInitializeAccount2Instruction<TProgram, TAccountMetas> {
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
      rent: getNextAccount(),
    },
    data: getInitializeAccount2InstructionDataDecoder().decode(
      instruction.data
    ),
  };
}
