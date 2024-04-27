import { generateSigner } from '@metaplex-foundation/umi';
import test from 'ava';
import { advanceNonceAccount, fetchNonce } from '../src/index.js';
import { createNonceAccount, createUmi } from './_setup.js';

test('it advances the nonce account', async (t) => {
  // Given an existing nonce account.
  const umi = await createUmi();
  const nonce = generateSigner(umi);
  const authority = generateSigner(umi);
  await createNonceAccount(umi, nonce, authority);
  const originalNonceAccount = await fetchNonce(umi, nonce.publicKey);

  // When the authority advances the nonce account.
  await advanceNonceAccount(umi, {
    nonceAccount: nonce.publicKey,
    nonceAuthority: authority,
  }).sendAndConfirm(umi);

  // Then we expect the blockhash to have been updated.
  const updatedNonceAccount = await fetchNonce(umi, nonce.publicKey);
  t.not(originalNonceAccount.blockhash, updatedNonceAccount.blockhash);
});
