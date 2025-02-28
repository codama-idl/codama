import {
  appendTransactionMessageInstruction,
  generateKeyPairSigner,
  pipe,
} from '@solana/kit';
import test from 'ava';
import { fetchNonce, getAdvanceNonceAccountInstruction } from '../src/index.js';
import {
  createDefaultSolanaClient,
  createDefaultTransaction,
  createNonceAccount,
  generateKeyPairSignerWithSol,
  signAndSendTransaction,
} from './_setup.js';

test('it advances the nonce account', async (t) => {
  // Given an existing nonce account.
  const client = createDefaultSolanaClient();
  const [payer, nonce, authority] = await Promise.all([
    generateKeyPairSignerWithSol(client),
    generateKeyPairSigner(),
    generateKeyPairSigner(),
  ]);
  await createNonceAccount(client, payer, nonce, authority);
  const originalNonceAccount = await fetchNonce(client.rpc, nonce.address);

  // When the authority advances the nonce account.
  const advanceNonce = getAdvanceNonceAccountInstruction({
    nonceAccount: nonce.address,
    nonceAuthority: authority,
  });
  await pipe(
    await createDefaultTransaction(client, payer),
    (tx) => appendTransactionMessageInstruction(advanceNonce, tx),
    (tx) => signAndSendTransaction(client, tx)
  );

  // Then we expect the blockhash to have been updated.
  const updatedNonceAccount = await fetchNonce(client.rpc, nonce.address);
  t.not(
    originalNonceAccount.data.blockhash,
    updatedNonceAccount.data.blockhash
  );
});
