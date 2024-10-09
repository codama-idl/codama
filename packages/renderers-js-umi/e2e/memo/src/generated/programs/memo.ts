/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama/codama
 */

import {
  ClusterFilter,
  Context,
  Program,
  PublicKey,
} from '@metaplex-foundation/umi';
import { getMemoErrorFromCode, getMemoErrorFromName } from '../errors';

export const MEMO_PROGRAM_ID =
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr' as PublicKey<'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'>;

export function createMemoProgram(): Program {
  return {
    name: 'memo',
    publicKey: MEMO_PROGRAM_ID,
    getErrorFromCode(code: number, cause?: Error) {
      return getMemoErrorFromCode(code, this, cause);
    },
    getErrorFromName(name: string, cause?: Error) {
      return getMemoErrorFromName(name, this, cause);
    },
    isOnCluster() {
      return true;
    },
  };
}

export function getMemoProgram<T extends Program = Program>(
  context: Pick<Context, 'programs'>,
  clusterFilter?: ClusterFilter
): T {
  return context.programs.get<T>('memo', clusterFilter);
}

export function getMemoProgramId(
  context: Pick<Context, 'programs'>,
  clusterFilter?: ClusterFilter
): PublicKey {
  return context.programs.getPublicKey('memo', MEMO_PROGRAM_ID, clusterFilter);
}
