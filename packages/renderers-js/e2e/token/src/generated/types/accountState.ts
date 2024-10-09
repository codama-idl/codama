/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama/codama
 */

import {
  combineCodec,
  getEnumDecoder,
  getEnumEncoder,
  type Codec,
  type Decoder,
  type Encoder,
} from '@solana/web3.js';

export enum AccountState {
  Uninitialized,
  Initialized,
  Frozen,
}

export type AccountStateArgs = AccountState;

export function getAccountStateEncoder(): Encoder<AccountStateArgs> {
  return getEnumEncoder(AccountState);
}

export function getAccountStateDecoder(): Decoder<AccountState> {
  return getEnumDecoder(AccountState);
}

export function getAccountStateCodec(): Codec<AccountStateArgs, AccountState> {
  return combineCodec(getAccountStateEncoder(), getAccountStateDecoder());
}
