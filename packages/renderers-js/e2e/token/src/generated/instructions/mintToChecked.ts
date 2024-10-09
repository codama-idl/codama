/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama/codama
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
  type TransactionSigner,
  type WritableAccount,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ADDRESS } from '../programs';
import { getAccountMetaFactory, type ResolvedAccount } from '../shared';

export const MINT_TO_CHECKED_DISCRIMINATOR = 14;

export function getMintToCheckedDiscriminatorBytes() {
  return getU8Encoder().encode(MINT_TO_CHECKED_DISCRIMINATOR);
}

export type MintToCheckedInstruction<
  TProgram extends string = typeof TOKEN_PROGRAM_ADDRESS,
  TAccountMint extends string | IAccountMeta<string> = string,
  TAccountToken extends string | IAccountMeta<string> = string,
  TAccountMintAuthority extends string | IAccountMeta<string> = string,
  TRemainingAccounts extends readonly IAccountMeta<string>[] = [],
> = IInstruction<TProgram> &
  IInstructionWithData<Uint8Array> &
  IInstructionWithAccounts<
    [
      TAccountMint extends string
        ? WritableAccount<TAccountMint>
        : TAccountMint,
      TAccountToken extends string
        ? WritableAccount<TAccountToken>
        : TAccountToken,
      TAccountMintAuthority extends string
        ? ReadonlyAccount<TAccountMintAuthority>
        : TAccountMintAuthority,
      ...TRemainingAccounts,
    ]
  >;

export type MintToCheckedInstructionData = {
  discriminator: number;
  /** The amount of new tokens to mint. */
  amount: bigint;
  /** Expected number of base 10 digits to the right of the decimal place. */
  decimals: number;
};

export type MintToCheckedInstructionDataArgs = {
  /** The amount of new tokens to mint. */
  amount: number | bigint;
  /** Expected number of base 10 digits to the right of the decimal place. */
  decimals: number;
};

export function getMintToCheckedInstructionDataEncoder(): Encoder<MintToCheckedInstructionDataArgs> {
  return transformEncoder(
    getStructEncoder([
      ['discriminator', getU8Encoder()],
      ['amount', getU64Encoder()],
      ['decimals', getU8Encoder()],
    ]),
    (value) => ({ ...value, discriminator: MINT_TO_CHECKED_DISCRIMINATOR })
  );
}

export function getMintToCheckedInstructionDataDecoder(): Decoder<MintToCheckedInstructionData> {
  return getStructDecoder([
    ['discriminator', getU8Decoder()],
    ['amount', getU64Decoder()],
    ['decimals', getU8Decoder()],
  ]);
}

export function getMintToCheckedInstructionDataCodec(): Codec<
  MintToCheckedInstructionDataArgs,
  MintToCheckedInstructionData
> {
  return combineCodec(
    getMintToCheckedInstructionDataEncoder(),
    getMintToCheckedInstructionDataDecoder()
  );
}

export type MintToCheckedInput<
  TAccountMint extends string = string,
  TAccountToken extends string = string,
  TAccountMintAuthority extends string = string,
> = {
  /** The mint. */
  mint: Address<TAccountMint>;
  /** The account to mint tokens to. */
  token: Address<TAccountToken>;
  /** The mint's minting authority or its multisignature account. */
  mintAuthority:
    | Address<TAccountMintAuthority>
    | TransactionSigner<TAccountMintAuthority>;
  amount: MintToCheckedInstructionDataArgs['amount'];
  decimals: MintToCheckedInstructionDataArgs['decimals'];
  multiSigners?: Array<TransactionSigner>;
};

export function getMintToCheckedInstruction<
  TAccountMint extends string,
  TAccountToken extends string,
  TAccountMintAuthority extends string,
  TProgramAddress extends Address = typeof TOKEN_PROGRAM_ADDRESS,
>(
  input: MintToCheckedInput<TAccountMint, TAccountToken, TAccountMintAuthority>,
  config?: { programAddress?: TProgramAddress }
): MintToCheckedInstruction<
  TProgramAddress,
  TAccountMint,
  TAccountToken,
  (typeof input)['mintAuthority'] extends TransactionSigner<TAccountMintAuthority>
    ? ReadonlySignerAccount<TAccountMintAuthority> &
        IAccountSignerMeta<TAccountMintAuthority>
    : TAccountMintAuthority
> {
  // Program address.
  const programAddress = config?.programAddress ?? TOKEN_PROGRAM_ADDRESS;

  // Original accounts.
  const originalAccounts = {
    mint: { value: input.mint ?? null, isWritable: true },
    token: { value: input.token ?? null, isWritable: true },
    mintAuthority: { value: input.mintAuthority ?? null, isWritable: false },
  };
  const accounts = originalAccounts as Record<
    keyof typeof originalAccounts,
    ResolvedAccount
  >;

  // Original args.
  const args = { ...input };

  // Remaining accounts.
  const remainingAccounts: IAccountMeta[] = (args.multiSigners ?? []).map(
    (signer) => ({
      address: signer.address,
      role: AccountRole.READONLY_SIGNER,
      signer,
    })
  );

  const getAccountMeta = getAccountMetaFactory(programAddress, 'programId');
  const instruction = {
    accounts: [
      getAccountMeta(accounts.mint),
      getAccountMeta(accounts.token),
      getAccountMeta(accounts.mintAuthority),
      ...remainingAccounts,
    ],
    programAddress,
    data: getMintToCheckedInstructionDataEncoder().encode(
      args as MintToCheckedInstructionDataArgs
    ),
  } as MintToCheckedInstruction<
    TProgramAddress,
    TAccountMint,
    TAccountToken,
    (typeof input)['mintAuthority'] extends TransactionSigner<TAccountMintAuthority>
      ? ReadonlySignerAccount<TAccountMintAuthority> &
          IAccountSignerMeta<TAccountMintAuthority>
      : TAccountMintAuthority
  >;

  return instruction;
}

export type ParsedMintToCheckedInstruction<
  TProgram extends string = typeof TOKEN_PROGRAM_ADDRESS,
  TAccountMetas extends readonly IAccountMeta[] = readonly IAccountMeta[],
> = {
  programAddress: Address<TProgram>;
  accounts: {
    /** The mint. */
    mint: TAccountMetas[0];
    /** The account to mint tokens to. */
    token: TAccountMetas[1];
    /** The mint's minting authority or its multisignature account. */
    mintAuthority: TAccountMetas[2];
  };
  data: MintToCheckedInstructionData;
};

export function parseMintToCheckedInstruction<
  TProgram extends string,
  TAccountMetas extends readonly IAccountMeta[],
>(
  instruction: IInstruction<TProgram> &
    IInstructionWithAccounts<TAccountMetas> &
    IInstructionWithData<Uint8Array>
): ParsedMintToCheckedInstruction<TProgram, TAccountMetas> {
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
      mint: getNextAccount(),
      token: getNextAccount(),
      mintAuthority: getNextAccount(),
    },
    data: getMintToCheckedInstructionDataDecoder().decode(instruction.data),
  };
}
