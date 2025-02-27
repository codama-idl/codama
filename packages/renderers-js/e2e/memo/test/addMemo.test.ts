import {
  appendTransactionMessageInstruction,
  getBase58Encoder,
  getUtf8Decoder,
  pipe,
} from '@solana/kit';
import test from 'ava';
import { getAddMemoInstruction } from '../src/index.js';
import {
  createDefaultSolanaClient,
  createDefaultTransaction,
  generateKeyPairSignerWithSol,
  signAndSendTransaction,
} from './_setup.js';

test('it adds custom text to the transaction logs', async (t) => {
  // Given a payer wallet.
  const client = createDefaultSolanaClient();
  const payer = await generateKeyPairSignerWithSol(client);

  // When we create a transaction with a custom memo.
  const addMemo = getAddMemoInstruction({ memo: 'Hello world!' });
  const signature = await pipe(
    await createDefaultTransaction(client, payer),
    (tx) => appendTransactionMessageInstruction(addMemo, tx),
    async (tx) => signAndSendTransaction(client, tx)
  );

  // Then the instruction data contains our memo.
  const result = await client.rpc
    .getTransaction(signature, { maxSupportedTransactionVersion: 0 })
    .send();
  const instructionDataBase58 =
    result!.transaction.message.instructions[0].data;
  const instructionDataBytes = getBase58Encoder().encode(instructionDataBase58);
  const instructionMemo = getUtf8Decoder().decode(instructionDataBytes);
  t.is(instructionMemo, 'Hello world!');
});
