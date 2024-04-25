import {
  AccountRole,
  Address,
  appendTransactionMessageInstruction,
  generateKeyPairSigner,
  lamports,
  pipe,
} from '@solana/web3.js';
import test from 'ava';
import {
  getTransferSolInstruction,
  parseTransferSolInstruction,
} from '../src/index.js';
import {
  createDefaultSolanaClient,
  createDefaultTransaction,
  generateKeyPairSignerWithSol,
  getBalance,
  signAndSendTransaction,
} from './_setup.js';

test('it transfers SOL from one account to another', async (t) => {
  // Given a source account with 3 SOL and a destination account with no SOL.
  const client = createDefaultSolanaClient();
  const source = await generateKeyPairSignerWithSol(client, 3_000_000_000n);
  const destination = (await generateKeyPairSigner()).address;

  // When the source account transfers 1 SOL to the destination account.
  const transferSol = getTransferSolInstruction({
    source,
    destination,
    amount: 1_000_000_000,
  });
  await pipe(
    await createDefaultTransaction(client, source),
    (tx) => appendTransactionMessageInstruction(transferSol, tx),
    (tx) => signAndSendTransaction(client, tx)
  );

  // Then the source account now has roughly 2 SOL (minus the transaction fee).
  const sourceBalance = await getBalance(client, source.address);
  t.true(sourceBalance < 2_000_000_000n);
  t.true(sourceBalance > 1_999_000_000n);

  // And the destination account has exactly 1 SOL.
  t.is(await getBalance(client, destination), lamports(1_000_000_000n));
});

test('it parses the accounts and the data of an existing transfer SOL instruction', async (t) => {
  // Given a transfer SOL instruction with the following accounts and data.
  const source = await generateKeyPairSigner();
  const destination = (await generateKeyPairSigner()).address;
  const transferSol = getTransferSolInstruction({
    source,
    destination,
    amount: 1_000_000_000,
  });

  // When we parse this instruction.
  const parsedTransferSol = parseTransferSolInstruction(transferSol);

  // Then we expect the following accounts and data.
  t.is(parsedTransferSol.accounts.source.address, source.address);
  t.is(parsedTransferSol.accounts.source.role, AccountRole.WRITABLE_SIGNER);
  t.is(parsedTransferSol.accounts.source.signer, source);
  t.is(parsedTransferSol.accounts.destination.address, destination);
  t.is(parsedTransferSol.accounts.destination.role, AccountRole.WRITABLE);
  t.is(parsedTransferSol.data.amount, 1_000_000_000n);
  t.is(
    parsedTransferSol.programAddress,
    '11111111111111111111111111111111' as Address<'11111111111111111111111111111111'>
  );
});
