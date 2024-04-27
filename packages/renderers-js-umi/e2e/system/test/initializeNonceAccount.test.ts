import test from 'ava';
import {
  Nonce,
  NonceState,
  NonceVersion,
  SYSTEM_PROGRAM_ID,
  createAccount,
  fetchNonce,
  getNonceSize,
  initializeNonceAccount,
} from '../src/index.js';
import { createUmi } from './_setup.js';
import { generateSigner } from '@metaplex-foundation/umi';

test('it creates and initialize a durable nonce account', async (t) => {
  // Given some brand now payer, authority, and nonce KeyPairSigners.
  const umi = await createUmi();
  const nonce = generateSigner(umi);
  const nonceAuthority = generateSigner(umi);

  // When we use them to create and initialize a nonce account.
  const space = getNonceSize();
  const rent = await umi.rpc.getRent(getNonceSize());
  await createAccount(umi, {
    newAccount: nonce,
    lamports: rent.basisPoints,
    space,
    programAddress: SYSTEM_PROGRAM_ID,
  })
    .add(
      initializeNonceAccount(umi, {
        nonceAccount: nonce.publicKey,
        nonceAuthority: nonceAuthority.publicKey,
      })
    )
    .sendAndConfirm(umi);

  // Then we expect the nonce account to exist with the following data.
  t.like(await fetchNonce(umi, nonce.publicKey), <Nonce>{
    publicKey: nonce.publicKey,
    version: NonceVersion.Current,
    state: NonceState.Initialized,
    authority: nonceAuthority.publicKey,
  });
});
