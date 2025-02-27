import {
  appendTransactionMessageInstruction,
  generateKeyPairSigner,
  pipe,
} from '@solana/kit';
import test from 'ava';
import {
  type Mint,
  type Token,
  fetchMint,
  fetchToken,
  getTransferInstruction,
} from '../src/index.js';
import {
  createDefaultSolanaClient,
  createDefaultTransaction,
  createMint,
  createToken,
  createTokenWithAmount,
  generateKeyPairSignerWithSol,
  signAndSendTransaction,
} from './_setup.js';

test('it transfers tokens from one account to another', async (t) => {
  // Given a mint account and two token accounts.
  // One with 100 tokens and the other with 0 tokens.
  const client = createDefaultSolanaClient();
  const [payer, mintAuthority, ownerA, ownerB] = await Promise.all([
    generateKeyPairSignerWithSol(client),
    generateKeyPairSigner(),
    generateKeyPairSigner(),
    generateKeyPairSigner(),
  ]);
  const mint = await createMint(client, payer, mintAuthority.address);
  const [tokenA, tokenB] = await Promise.all([
    createTokenWithAmount(
      client,
      payer,
      mintAuthority,
      mint,
      ownerA.address,
      100n
    ),
    createToken(client, payer, mint, ownerB.address),
  ]);

  // When owner A transfers 50 tokens to owner B.
  const transfer = getTransferInstruction({
    source: tokenA,
    destination: tokenB,
    authority: ownerA,
    amount: 50n,
  });
  await pipe(
    await createDefaultTransaction(client, payer),
    (tx) => appendTransactionMessageInstruction(transfer, tx),
    (tx) => signAndSendTransaction(client, tx)
  );

  // Then we expect the mint and token accounts to have the following updated data.
  const [{ data: mintData }, { data: tokenDataA }, { data: tokenDataB }] =
    await Promise.all([
      fetchMint(client.rpc, mint),
      fetchToken(client.rpc, tokenA),
      fetchToken(client.rpc, tokenB),
    ]);
  t.like(mintData, <Mint>{ supply: 100n });
  t.like(tokenDataA, <Token>{ amount: 50n });
  t.like(tokenDataB, <Token>{ amount: 50n });
});
