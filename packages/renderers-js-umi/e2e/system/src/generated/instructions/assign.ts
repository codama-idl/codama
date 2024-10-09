/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama/codama
 */

import {
  Context,
  PublicKey,
  Signer,
  TransactionBuilder,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import {
  Serializer,
  mapSerializer,
  publicKey as publicKeySerializer,
  struct,
  u32,
} from '@metaplex-foundation/umi/serializers';
import {
  ResolvedAccount,
  ResolvedAccountsWithIndices,
  getAccountMetasAndSigners,
} from '../shared';

// Accounts.
export type AssignInstructionAccounts = {
  account: Signer;
};

// Data.
export type AssignInstructionData = {
  discriminator: number;
  programAddress: PublicKey;
};

export type AssignInstructionDataArgs = { programAddress: PublicKey };

export function getAssignInstructionDataSerializer(): Serializer<
  AssignInstructionDataArgs,
  AssignInstructionData
> {
  return mapSerializer<AssignInstructionDataArgs, any, AssignInstructionData>(
    struct<AssignInstructionData>(
      [
        ['discriminator', u32()],
        ['programAddress', publicKeySerializer()],
      ],
      { description: 'AssignInstructionData' }
    ),
    (value) => ({ ...value, discriminator: 1 })
  ) as Serializer<AssignInstructionDataArgs, AssignInstructionData>;
}

// Args.
export type AssignInstructionArgs = AssignInstructionDataArgs;

// Instruction.
export function assign(
  context: Pick<Context, 'programs'>,
  input: AssignInstructionAccounts & AssignInstructionArgs
): TransactionBuilder {
  // Program ID.
  const programId = context.programs.getPublicKey(
    'system',
    '11111111111111111111111111111111'
  );

  // Accounts.
  const resolvedAccounts = {
    account: {
      index: 0,
      isWritable: true as boolean,
      value: input.account ?? null,
    },
  } satisfies ResolvedAccountsWithIndices;

  // Arguments.
  const resolvedArgs: AssignInstructionArgs = { ...input };

  // Accounts in order.
  const orderedAccounts: ResolvedAccount[] = Object.values(
    resolvedAccounts
  ).sort((a, b) => a.index - b.index);

  // Keys and Signers.
  const [keys, signers] = getAccountMetasAndSigners(
    orderedAccounts,
    'programId',
    programId
  );

  // Data.
  const data = getAssignInstructionDataSerializer().serialize(
    resolvedArgs as AssignInstructionDataArgs
  );

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
