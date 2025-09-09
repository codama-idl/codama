import {
  type Account,
  appendTransactionMessageInstruction,
  generateKeyPairSigner,
  none,
  pipe,
} from '@solana/kit';
import test from 'ava';
import {
  AccountState,
  TOKEN_PROGRAM_ADDRESS,
  type Token,
  fetchToken,
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstructionAsync,
} from '../src';
import {
  createDefaultSolanaClient,
  createDefaultTransaction,
  createMint,
  generateKeyPairSignerWithSol,
  signAndSendTransaction,
} from './_setup';

test('it creates a new associated token account', async (t) => {
  // Given a mint account, its mint authority and a token owner.
  const client = createDefaultSolanaClient();
  const [payer, mintAuthority, owner] = await Promise.all([
    generateKeyPairSignerWithSol(client),
    generateKeyPairSigner(),
    generateKeyPairSigner(),
  ]);
  const mint = await createMint(client, payer, mintAuthority.address);

  // When we create and initialize a token account at this address.
  const createAta = await getCreateAssociatedTokenIdempotentInstructionAsync({
    payer,
    mint,
    owner: owner.address,
  });

  await pipe(
    await createDefaultTransaction(client, payer),
    (tx) => appendTransactionMessageInstruction(createAta, tx),
    (tx) => signAndSendTransaction(client, tx)
  );

  // Then we expect the token account to exist and have the following data.
  const [ata] = await findAssociatedTokenPda({
    mint,
    owner: owner.address,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });
  t.like(await fetchToken(client.rpc, ata), <Account<Token>>{
    address: ata,
    data: {
      mint,
      owner: owner.address,
      amount: 0n,
      delegate: none(),
      state: AccountState.Initialized,
      isNative: none(),
      delegatedAmount: 0n,
      closeAuthority: none(),
    },
  });
});
