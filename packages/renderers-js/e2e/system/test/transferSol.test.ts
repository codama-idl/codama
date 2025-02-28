import {
  AccountRole,
  type Address,
  appendTransactionMessageInstruction,
  generateKeyPairSigner,
  isSolanaError,
  lamports,
  pipe,
  SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM,
  SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE,
  SolanaError,
} from '@solana/kit';
import test from 'ava';
import {
  getTransferSolInstruction,
  isSystemError,
  parseTransferSolInstruction,
  SYSTEM_ERROR__RESULT_WITH_NEGATIVE_LAMPORTS,
  type SystemError,
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

test('it fails if the source account does not have enough SOLs', async (t) => {
  // Given a source account with 1 SOL and a destination account with no SOL.
  const client = createDefaultSolanaClient();
  const source = await generateKeyPairSignerWithSol(client, 1_000_000_000n);
  const destination = (await generateKeyPairSigner()).address;

  // When the source account tries to transfer 2 SOLs to the destination account.
  const transferSol = getTransferSolInstruction({
    source,
    destination,
    amount: 2_000_000_000,
  });
  const txMessage = pipe(await createDefaultTransaction(client, source), (tx) =>
    appendTransactionMessageInstruction(transferSol, tx)
  );
  const promise = signAndSendTransaction(client, txMessage);

  // Then we expect the transaction to fail and to have the correct error code.
  const error = await t.throwsAsync(promise);
  if (
    isSolanaError(
      error,
      SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE
    )
  ) {
    error satisfies SolanaError<
      typeof SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE
    >;
    if (isSystemError(error.cause, txMessage)) {
      error.cause satisfies SolanaError<
        typeof SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM
      > & { readonly context: { readonly code: SystemError } };
      if (
        isSystemError(
          error.cause,
          txMessage,
          SYSTEM_ERROR__RESULT_WITH_NEGATIVE_LAMPORTS
        )
      ) {
        error.cause.context
          .code satisfies typeof SYSTEM_ERROR__RESULT_WITH_NEGATIVE_LAMPORTS;
        t.is(
          error.cause.context.code,
          SYSTEM_ERROR__RESULT_WITH_NEGATIVE_LAMPORTS
        );
      } else {
        t.fail('Expected a negative lamports system program error');
      }
    } else {
      t.fail('Expected a system program error');
    }
  } else {
    t.fail('Expected a preflight failure');
  }
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
