/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama/codama
 */

import {
  Account,
  Context,
  Pda,
  PublicKey,
  RpcAccount,
  RpcGetAccountOptions,
  RpcGetAccountsOptions,
  assertAccountExists,
  deserializeAccount,
  gpaBuilder,
  publicKey as toPublicKey,
} from '@metaplex-foundation/umi';
import {
  Serializer,
  publicKey as publicKeySerializer,
  struct,
  u64,
} from '@metaplex-foundation/umi/serializers';
import {
  NonceState,
  NonceStateArgs,
  NonceVersion,
  NonceVersionArgs,
  getNonceStateSerializer,
  getNonceVersionSerializer,
} from '../types';

export type Nonce = Account<NonceAccountData>;

export type NonceAccountData = {
  version: NonceVersion;
  state: NonceState;
  authority: PublicKey;
  blockhash: PublicKey;
  lamportsPerSignature: bigint;
};

export type NonceAccountDataArgs = {
  version: NonceVersionArgs;
  state: NonceStateArgs;
  authority: PublicKey;
  blockhash: PublicKey;
  lamportsPerSignature: number | bigint;
};

export function getNonceAccountDataSerializer(): Serializer<
  NonceAccountDataArgs,
  NonceAccountData
> {
  return struct<NonceAccountData>(
    [
      ['version', getNonceVersionSerializer()],
      ['state', getNonceStateSerializer()],
      ['authority', publicKeySerializer()],
      ['blockhash', publicKeySerializer()],
      ['lamportsPerSignature', u64()],
    ],
    { description: 'NonceAccountData' }
  ) as Serializer<NonceAccountDataArgs, NonceAccountData>;
}

export function deserializeNonce(rawAccount: RpcAccount): Nonce {
  return deserializeAccount(rawAccount, getNonceAccountDataSerializer());
}

export async function fetchNonce(
  context: Pick<Context, 'rpc'>,
  publicKey: PublicKey | Pda,
  options?: RpcGetAccountOptions
): Promise<Nonce> {
  const maybeAccount = await context.rpc.getAccount(
    toPublicKey(publicKey, false),
    options
  );
  assertAccountExists(maybeAccount, 'Nonce');
  return deserializeNonce(maybeAccount);
}

export async function safeFetchNonce(
  context: Pick<Context, 'rpc'>,
  publicKey: PublicKey | Pda,
  options?: RpcGetAccountOptions
): Promise<Nonce | null> {
  const maybeAccount = await context.rpc.getAccount(
    toPublicKey(publicKey, false),
    options
  );
  return maybeAccount.exists ? deserializeNonce(maybeAccount) : null;
}

export async function fetchAllNonce(
  context: Pick<Context, 'rpc'>,
  publicKeys: Array<PublicKey | Pda>,
  options?: RpcGetAccountsOptions
): Promise<Nonce[]> {
  const maybeAccounts = await context.rpc.getAccounts(
    publicKeys.map((key) => toPublicKey(key, false)),
    options
  );
  return maybeAccounts.map((maybeAccount) => {
    assertAccountExists(maybeAccount, 'Nonce');
    return deserializeNonce(maybeAccount);
  });
}

export async function safeFetchAllNonce(
  context: Pick<Context, 'rpc'>,
  publicKeys: Array<PublicKey | Pda>,
  options?: RpcGetAccountsOptions
): Promise<Nonce[]> {
  const maybeAccounts = await context.rpc.getAccounts(
    publicKeys.map((key) => toPublicKey(key, false)),
    options
  );
  return maybeAccounts
    .filter((maybeAccount) => maybeAccount.exists)
    .map((maybeAccount) => deserializeNonce(maybeAccount as RpcAccount));
}

export function getNonceGpaBuilder(context: Pick<Context, 'rpc' | 'programs'>) {
  const programId = context.programs.getPublicKey(
    'system',
    '11111111111111111111111111111111'
  );
  return gpaBuilder(context, programId)
    .registerFields<{
      version: NonceVersionArgs;
      state: NonceStateArgs;
      authority: PublicKey;
      blockhash: PublicKey;
      lamportsPerSignature: number | bigint;
    }>({
      version: [0, getNonceVersionSerializer()],
      state: [4, getNonceStateSerializer()],
      authority: [8, publicKeySerializer()],
      blockhash: [40, publicKeySerializer()],
      lamportsPerSignature: [72, u64()],
    })
    .deserializeUsing<Nonce>((account) => deserializeNonce(account));
}

export function getNonceSize(): number {
  return 80;
}
