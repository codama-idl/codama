import {
  type Account,
  appendTransactionMessageInstruction,
  generateKeyPairSigner,
  pipe,
} from '@solana/kit';
import test from 'ava';
import {
  type Nonce,
  NonceState,
  NonceVersion,
  SYSTEM_PROGRAM_ADDRESS,
  fetchNonce,
  getCreateAccountInstruction,
  getInitializeNonceAccountInstruction,
  getNonceSize,
} from '../src/index.js';
import {
  createDefaultSolanaClient,
  createDefaultTransaction,
  generateKeyPairSignerWithSol,
  signAndSendTransaction,
} from './_setup.js';

test('it creates and initialize a durable nonce account', async (t) => {
  // Given some brand now payer, authority, and nonce KeyPairSigners.
  const client = createDefaultSolanaClient();
  const payer = await generateKeyPairSignerWithSol(client);
  const nonce = await generateKeyPairSigner();
  const nonceAuthority = await generateKeyPairSigner();

  // When we use them to create and initialize a nonce account.
  const space = BigInt(getNonceSize());
  const rent = await client.rpc.getMinimumBalanceForRentExemption(space).send();
  const createAccount = getCreateAccountInstruction({
    payer,
    newAccount: nonce,
    lamports: rent,
    space,
    programAddress: SYSTEM_PROGRAM_ADDRESS,
  });
  const initializeNonceAccount = getInitializeNonceAccountInstruction({
    nonceAccount: nonce.address,
    nonceAuthority: nonceAuthority.address,
  });
  await pipe(
    await createDefaultTransaction(client, payer),
    (tx) => appendTransactionMessageInstruction(createAccount, tx),
    (tx) => appendTransactionMessageInstruction(initializeNonceAccount, tx),
    (tx) => signAndSendTransaction(client, tx)
  );

  // Then we expect the nonce account to exist with the following data.
  t.like(await fetchNonce(client.rpc, nonce.address), <Account<Nonce>>{
    address: nonce.address,
    data: {
      version: NonceVersion.Current,
      state: NonceState.Initialized,
      authority: nonceAuthority.address,
    },
  });
});
