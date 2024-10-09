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
  getU8Decoder,
  getU8Encoder,
  getUtf8Decoder,
  getUtf8Encoder,
  transformEncoder,
  type Address,
  type Codec,
  type Decoder,
  type Encoder,
  type IAccountMeta,
  type IInstruction,
  type IInstructionWithAccounts,
  type IInstructionWithData,
  type ReadonlyAccount,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ADDRESS } from '../programs';
import { getAccountMetaFactory, type ResolvedAccount } from '../shared';

export const UI_AMOUNT_TO_AMOUNT_DISCRIMINATOR = 24;

export function getUiAmountToAmountDiscriminatorBytes() {
  return getU8Encoder().encode(UI_AMOUNT_TO_AMOUNT_DISCRIMINATOR);
}

export type UiAmountToAmountInstruction<
  TProgram extends string = typeof TOKEN_PROGRAM_ADDRESS,
  TAccountMint extends string | IAccountMeta<string> = string,
  TRemainingAccounts extends readonly IAccountMeta<string>[] = [],
> = IInstruction<TProgram> &
  IInstructionWithData<Uint8Array> &
  IInstructionWithAccounts<
    [
      TAccountMint extends string
        ? ReadonlyAccount<TAccountMint>
        : TAccountMint,
      ...TRemainingAccounts,
    ]
  >;

export type UiAmountToAmountInstructionData = {
  discriminator: number;
  /** The ui_amount of tokens to reformat. */
  uiAmount: string;
};

export type UiAmountToAmountInstructionDataArgs = {
  /** The ui_amount of tokens to reformat. */
  uiAmount: string;
};

export function getUiAmountToAmountInstructionDataEncoder(): Encoder<UiAmountToAmountInstructionDataArgs> {
  return transformEncoder(
    getStructEncoder([
      ['discriminator', getU8Encoder()],
      ['uiAmount', getUtf8Encoder()],
    ]),
    (value) => ({ ...value, discriminator: UI_AMOUNT_TO_AMOUNT_DISCRIMINATOR })
  );
}

export function getUiAmountToAmountInstructionDataDecoder(): Decoder<UiAmountToAmountInstructionData> {
  return getStructDecoder([
    ['discriminator', getU8Decoder()],
    ['uiAmount', getUtf8Decoder()],
  ]);
}

export function getUiAmountToAmountInstructionDataCodec(): Codec<
  UiAmountToAmountInstructionDataArgs,
  UiAmountToAmountInstructionData
> {
  return combineCodec(
    getUiAmountToAmountInstructionDataEncoder(),
    getUiAmountToAmountInstructionDataDecoder()
  );
}

export type UiAmountToAmountInput<TAccountMint extends string = string> = {
  /** The mint to calculate for. */
  mint: Address<TAccountMint>;
  uiAmount: UiAmountToAmountInstructionDataArgs['uiAmount'];
};

export function getUiAmountToAmountInstruction<
  TAccountMint extends string,
  TProgramAddress extends Address = typeof TOKEN_PROGRAM_ADDRESS,
>(
  input: UiAmountToAmountInput<TAccountMint>,
  config?: { programAddress?: TProgramAddress }
): UiAmountToAmountInstruction<TProgramAddress, TAccountMint> {
  // Program address.
  const programAddress = config?.programAddress ?? TOKEN_PROGRAM_ADDRESS;

  // Original accounts.
  const originalAccounts = {
    mint: { value: input.mint ?? null, isWritable: false },
  };
  const accounts = originalAccounts as Record<
    keyof typeof originalAccounts,
    ResolvedAccount
  >;

  // Original args.
  const args = { ...input };

  const getAccountMeta = getAccountMetaFactory(programAddress, 'programId');
  const instruction = {
    accounts: [getAccountMeta(accounts.mint)],
    programAddress,
    data: getUiAmountToAmountInstructionDataEncoder().encode(
      args as UiAmountToAmountInstructionDataArgs
    ),
  } as UiAmountToAmountInstruction<TProgramAddress, TAccountMint>;

  return instruction;
}

export type ParsedUiAmountToAmountInstruction<
  TProgram extends string = typeof TOKEN_PROGRAM_ADDRESS,
  TAccountMetas extends readonly IAccountMeta[] = readonly IAccountMeta[],
> = {
  programAddress: Address<TProgram>;
  accounts: {
    /** The mint to calculate for. */
    mint: TAccountMetas[0];
  };
  data: UiAmountToAmountInstructionData;
};

export function parseUiAmountToAmountInstruction<
  TProgram extends string,
  TAccountMetas extends readonly IAccountMeta[],
>(
  instruction: IInstruction<TProgram> &
    IInstructionWithAccounts<TAccountMetas> &
    IInstructionWithData<Uint8Array>
): ParsedUiAmountToAmountInstruction<TProgram, TAccountMetas> {
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
      mint: getNextAccount(),
    },
    data: getUiAmountToAmountInstructionDataDecoder().decode(instruction.data),
  };
}
