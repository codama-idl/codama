/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  combineCodec,
  fixDecoderSize,
  fixEncoderSize,
  getAddressEncoder,
  getBytesDecoder,
  getBytesEncoder,
  getProgramDerivedAddress,
  getStructDecoder,
  getStructEncoder,
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
  type ReadonlyUint8Array,
  type TransactionSigner,
  type WritableAccount,
  type WritableSignerAccount,
} from '@solana/kit';
import { WEN_TRANSFER_GUARD_PROGRAM_ADDRESS } from '../programs';
import {
  expectAddress,
  getAccountMetaFactory,
  type ResolvedAccount,
} from '../shared';

export const INITIALIZE_DISCRIMINATOR = new Uint8Array([
  43, 34, 13, 49, 167, 88, 235, 235,
]);

export function getInitializeDiscriminatorBytes() {
  return fixEncoderSize(getBytesEncoder(), 8).encode(INITIALIZE_DISCRIMINATOR);
}

export type InitializeInstruction<
  TProgram extends string = typeof WEN_TRANSFER_GUARD_PROGRAM_ADDRESS,
  TAccountExtraMetasAccount extends string | IAccountMeta<string> = string,
  TAccountGuard extends string | IAccountMeta<string> = string,
  TAccountMint extends string | IAccountMeta<string> = string,
  TAccountTransferHookAuthority extends string | IAccountMeta<string> = string,
  TAccountSystemProgram extends
    | string
    | IAccountMeta<string> = '11111111111111111111111111111111',
  TAccountPayer extends string | IAccountMeta<string> = string,
  TRemainingAccounts extends readonly IAccountMeta<string>[] = [],
> = IInstruction<TProgram> &
  IInstructionWithData<Uint8Array> &
  IInstructionWithAccounts<
    [
      TAccountExtraMetasAccount extends string
        ? WritableAccount<TAccountExtraMetasAccount>
        : TAccountExtraMetasAccount,
      TAccountGuard extends string
        ? ReadonlyAccount<TAccountGuard>
        : TAccountGuard,
      TAccountMint extends string
        ? ReadonlyAccount<TAccountMint>
        : TAccountMint,
      TAccountTransferHookAuthority extends string
        ? WritableSignerAccount<TAccountTransferHookAuthority> &
            IAccountSignerMeta<TAccountTransferHookAuthority>
        : TAccountTransferHookAuthority,
      TAccountSystemProgram extends string
        ? ReadonlyAccount<TAccountSystemProgram>
        : TAccountSystemProgram,
      TAccountPayer extends string
        ? WritableSignerAccount<TAccountPayer> &
            IAccountSignerMeta<TAccountPayer>
        : TAccountPayer,
      ...TRemainingAccounts,
    ]
  >;

export type InitializeInstructionData = { discriminator: ReadonlyUint8Array };

export type InitializeInstructionDataArgs = {};

export function getInitializeInstructionDataEncoder(): Encoder<InitializeInstructionDataArgs> {
  return transformEncoder(
    getStructEncoder([['discriminator', fixEncoderSize(getBytesEncoder(), 8)]]),
    (value) => ({ ...value, discriminator: INITIALIZE_DISCRIMINATOR })
  );
}

export function getInitializeInstructionDataDecoder(): Decoder<InitializeInstructionData> {
  return getStructDecoder([
    ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
  ]);
}

export function getInitializeInstructionDataCodec(): Codec<
  InitializeInstructionDataArgs,
  InitializeInstructionData
> {
  return combineCodec(
    getInitializeInstructionDataEncoder(),
    getInitializeInstructionDataDecoder()
  );
}

export type InitializeAsyncInput<
  TAccountExtraMetasAccount extends string = string,
  TAccountGuard extends string = string,
  TAccountMint extends string = string,
  TAccountTransferHookAuthority extends string = string,
  TAccountSystemProgram extends string = string,
  TAccountPayer extends string = string,
> = {
  extraMetasAccount?: Address<TAccountExtraMetasAccount>;
  guard: Address<TAccountGuard>;
  mint: Address<TAccountMint>;
  transferHookAuthority: TransactionSigner<TAccountTransferHookAuthority>;
  systemProgram?: Address<TAccountSystemProgram>;
  payer: TransactionSigner<TAccountPayer>;
};

export async function getInitializeInstructionAsync<
  TAccountExtraMetasAccount extends string,
  TAccountGuard extends string,
  TAccountMint extends string,
  TAccountTransferHookAuthority extends string,
  TAccountSystemProgram extends string,
  TAccountPayer extends string,
  TProgramAddress extends Address = typeof WEN_TRANSFER_GUARD_PROGRAM_ADDRESS,
>(
  input: InitializeAsyncInput<
    TAccountExtraMetasAccount,
    TAccountGuard,
    TAccountMint,
    TAccountTransferHookAuthority,
    TAccountSystemProgram,
    TAccountPayer
  >,
  config?: { programAddress?: TProgramAddress }
): Promise<
  InitializeInstruction<
    TProgramAddress,
    TAccountExtraMetasAccount,
    TAccountGuard,
    TAccountMint,
    TAccountTransferHookAuthority,
    TAccountSystemProgram,
    TAccountPayer
  >
> {
  // Program address.
  const programAddress =
    config?.programAddress ?? WEN_TRANSFER_GUARD_PROGRAM_ADDRESS;

  // Original accounts.
  const originalAccounts = {
    extraMetasAccount: {
      value: input.extraMetasAccount ?? null,
      isWritable: true,
    },
    guard: { value: input.guard ?? null, isWritable: false },
    mint: { value: input.mint ?? null, isWritable: false },
    transferHookAuthority: {
      value: input.transferHookAuthority ?? null,
      isWritable: true,
    },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false },
    payer: { value: input.payer ?? null, isWritable: true },
  };
  const accounts = originalAccounts as Record<
    keyof typeof originalAccounts,
    ResolvedAccount
  >;

  // Resolve default values.
  if (!accounts.extraMetasAccount.value) {
    accounts.extraMetasAccount.value = await getProgramDerivedAddress({
      programAddress,
      seeds: [
        getBytesEncoder().encode(
          new Uint8Array([
            101, 120, 116, 114, 97, 45, 97, 99, 99, 111, 117, 110, 116, 45, 109,
            101, 116, 97, 115,
          ])
        ),
        getAddressEncoder().encode(expectAddress(accounts.mint.value)),
      ],
    });
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value =
      '11111111111111111111111111111111' as Address<'11111111111111111111111111111111'>;
  }

  const getAccountMeta = getAccountMetaFactory(programAddress, 'programId');
  const instruction = {
    accounts: [
      getAccountMeta(accounts.extraMetasAccount),
      getAccountMeta(accounts.guard),
      getAccountMeta(accounts.mint),
      getAccountMeta(accounts.transferHookAuthority),
      getAccountMeta(accounts.systemProgram),
      getAccountMeta(accounts.payer),
    ],
    programAddress,
    data: getInitializeInstructionDataEncoder().encode({}),
  } as InitializeInstruction<
    TProgramAddress,
    TAccountExtraMetasAccount,
    TAccountGuard,
    TAccountMint,
    TAccountTransferHookAuthority,
    TAccountSystemProgram,
    TAccountPayer
  >;

  return instruction;
}

export type InitializeInput<
  TAccountExtraMetasAccount extends string = string,
  TAccountGuard extends string = string,
  TAccountMint extends string = string,
  TAccountTransferHookAuthority extends string = string,
  TAccountSystemProgram extends string = string,
  TAccountPayer extends string = string,
> = {
  extraMetasAccount: Address<TAccountExtraMetasAccount>;
  guard: Address<TAccountGuard>;
  mint: Address<TAccountMint>;
  transferHookAuthority: TransactionSigner<TAccountTransferHookAuthority>;
  systemProgram?: Address<TAccountSystemProgram>;
  payer: TransactionSigner<TAccountPayer>;
};

export function getInitializeInstruction<
  TAccountExtraMetasAccount extends string,
  TAccountGuard extends string,
  TAccountMint extends string,
  TAccountTransferHookAuthority extends string,
  TAccountSystemProgram extends string,
  TAccountPayer extends string,
  TProgramAddress extends Address = typeof WEN_TRANSFER_GUARD_PROGRAM_ADDRESS,
>(
  input: InitializeInput<
    TAccountExtraMetasAccount,
    TAccountGuard,
    TAccountMint,
    TAccountTransferHookAuthority,
    TAccountSystemProgram,
    TAccountPayer
  >,
  config?: { programAddress?: TProgramAddress }
): InitializeInstruction<
  TProgramAddress,
  TAccountExtraMetasAccount,
  TAccountGuard,
  TAccountMint,
  TAccountTransferHookAuthority,
  TAccountSystemProgram,
  TAccountPayer
> {
  // Program address.
  const programAddress =
    config?.programAddress ?? WEN_TRANSFER_GUARD_PROGRAM_ADDRESS;

  // Original accounts.
  const originalAccounts = {
    extraMetasAccount: {
      value: input.extraMetasAccount ?? null,
      isWritable: true,
    },
    guard: { value: input.guard ?? null, isWritable: false },
    mint: { value: input.mint ?? null, isWritable: false },
    transferHookAuthority: {
      value: input.transferHookAuthority ?? null,
      isWritable: true,
    },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false },
    payer: { value: input.payer ?? null, isWritable: true },
  };
  const accounts = originalAccounts as Record<
    keyof typeof originalAccounts,
    ResolvedAccount
  >;

  // Resolve default values.
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value =
      '11111111111111111111111111111111' as Address<'11111111111111111111111111111111'>;
  }

  const getAccountMeta = getAccountMetaFactory(programAddress, 'programId');
  const instruction = {
    accounts: [
      getAccountMeta(accounts.extraMetasAccount),
      getAccountMeta(accounts.guard),
      getAccountMeta(accounts.mint),
      getAccountMeta(accounts.transferHookAuthority),
      getAccountMeta(accounts.systemProgram),
      getAccountMeta(accounts.payer),
    ],
    programAddress,
    data: getInitializeInstructionDataEncoder().encode({}),
  } as InitializeInstruction<
    TProgramAddress,
    TAccountExtraMetasAccount,
    TAccountGuard,
    TAccountMint,
    TAccountTransferHookAuthority,
    TAccountSystemProgram,
    TAccountPayer
  >;

  return instruction;
}

export type ParsedInitializeInstruction<
  TProgram extends string = typeof WEN_TRANSFER_GUARD_PROGRAM_ADDRESS,
  TAccountMetas extends readonly IAccountMeta[] = readonly IAccountMeta[],
> = {
  programAddress: Address<TProgram>;
  accounts: {
    extraMetasAccount: TAccountMetas[0];
    guard: TAccountMetas[1];
    mint: TAccountMetas[2];
    transferHookAuthority: TAccountMetas[3];
    systemProgram: TAccountMetas[4];
    payer: TAccountMetas[5];
  };
  data: InitializeInstructionData;
};

export function parseInitializeInstruction<
  TProgram extends string,
  TAccountMetas extends readonly IAccountMeta[],
>(
  instruction: IInstruction<TProgram> &
    IInstructionWithAccounts<TAccountMetas> &
    IInstructionWithData<Uint8Array>
): ParsedInitializeInstruction<TProgram, TAccountMetas> {
  if (instruction.accounts.length < 6) {
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
      extraMetasAccount: getNextAccount(),
      guard: getNextAccount(),
      mint: getNextAccount(),
      transferHookAuthority: getNextAccount(),
      systemProgram: getNextAccount(),
      payer: getNextAccount(),
    },
    data: getInitializeInstructionDataDecoder().decode(instruction.data),
  };
}
