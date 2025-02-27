import {
  appendTransactionMessageInstruction,
  fetchEncodedAccount,
  generateKeyPairSigner,
  pipe,
} from '@solana/kit';
import test from 'ava';
import {
  SYSTEM_PROGRAM_ADDRESS,
  getCreateAccountInstruction,
} from '../src/index.js';
import {
  createDefaultSolanaClient,
  createDefaultTransaction,
  generateKeyPairSignerWithSol,
  signAndSendTransaction,
} from './_setup.js';

test('it creates a new empty account', async (t) => {
  // Given we have a newly generated account keypair to create with 42 bytes of space.
  const client = createDefaultSolanaClient();
  const space = 42n;
  const [payer, newAccount, lamports] = await Promise.all([
    generateKeyPairSignerWithSol(client),
    generateKeyPairSigner(),
    client.rpc.getMinimumBalanceForRentExemption(space).send(),
  ]);

  // When we call createAccount in a transaction.
  const createAccount = getCreateAccountInstruction({
    payer,
    newAccount,
    space,
    lamports,
    programAddress: SYSTEM_PROGRAM_ADDRESS,
  });
  await pipe(
    await createDefaultTransaction(client, payer),
    (tx) => appendTransactionMessageInstruction(createAccount, tx),
    (tx) => signAndSendTransaction(client, tx)
  );

  // Then we expect the following account data.
  const fetchedAccount = await fetchEncodedAccount(
    client.rpc,
    newAccount.address
  );
  t.deepEqual(fetchedAccount, {
    executable: false,
    lamports,
    programAddress: SYSTEM_PROGRAM_ADDRESS,
    space: 42n,
    address: newAccount.address,
    data: new Uint8Array(Array.from({ length: 42 }, () => 0)),
    exists: true,
  });
});
