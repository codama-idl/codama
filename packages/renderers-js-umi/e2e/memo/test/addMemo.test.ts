import { utf8 } from '@metaplex-foundation/umi/serializers';
import test from 'ava';
import { addMemo } from '../src/index.js';
import { createUmi } from './_setup.js';

test('it adds custom text to the transaction logs', async (t) => {
  // Given a payer wallet.
  const umi = await createUmi();

  // When we create a transaction with a custom memo.
  const { signature } = await addMemo(umi, {
    memo: 'Hello world!',
  }).sendAndConfirm(umi);

  // Then the instruction data contains our memo.
  const transaction = await umi.rpc.getTransaction(signature);
  const instructionDataBytes =
    transaction?.message.instructions[0].data ?? new Uint8Array();
  const [instructionMemo] = utf8.deserialize(instructionDataBytes);
  t.is(instructionMemo, 'Hello world!');
});
