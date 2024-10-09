/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama/codama
 */

import {
  Context,
  TransactionBuilder,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import {
  Serializer,
  string,
  struct,
} from '@metaplex-foundation/umi/serializers';
import {
  ResolvedAccount,
  ResolvedAccountsWithIndices,
  getAccountMetasAndSigners,
} from '../shared';

// Data.
export type AddMemoInstructionData = { memo: string };

export type AddMemoInstructionDataArgs = AddMemoInstructionData;

export function getAddMemoInstructionDataSerializer(): Serializer<
  AddMemoInstructionDataArgs,
  AddMemoInstructionData
> {
  return struct<AddMemoInstructionData>(
    [['memo', string({ size: 'variable' })]],
    { description: 'AddMemoInstructionData' }
  ) as Serializer<AddMemoInstructionDataArgs, AddMemoInstructionData>;
}

// Args.
export type AddMemoInstructionArgs = AddMemoInstructionDataArgs;

// Instruction.
export function addMemo(
  context: Pick<Context, 'programs'>,
  input: AddMemoInstructionArgs
): TransactionBuilder {
  // Program ID.
  const programId = context.programs.getPublicKey(
    'memo',
    'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'
  );

  // Accounts.
  const resolvedAccounts = {} satisfies ResolvedAccountsWithIndices;

  // Arguments.
  const resolvedArgs: AddMemoInstructionArgs = { ...input };

  // Accounts in order.
  const orderedAccounts: ResolvedAccount[] = Object.values(
    resolvedAccounts as ResolvedAccountsWithIndices
  );

  // Keys and Signers.
  const [keys, signers] = getAccountMetasAndSigners(
    orderedAccounts,
    'programId',
    programId
  );

  // Data.
  const data = getAddMemoInstructionDataSerializer().serialize(
    resolvedArgs as AddMemoInstructionDataArgs
  );

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
