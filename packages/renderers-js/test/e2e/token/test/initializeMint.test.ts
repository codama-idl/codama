import {
  type Account,
  appendTransactionMessageInstructions,
  generateKeyPairSigner,
  none,
  pipe,
  some,
} from '@solana/kit';
import test from 'ava';
import {
  type Mint,
  TOKEN_PROGRAM_ADDRESS,
  fetchMint,
  getCreateAccountInstruction,
  getInitializeMintInstruction,
  getMintSize,
} from '../src/index.js';
import {
  createDefaultSolanaClient,
  createDefaultTransaction,
  generateKeyPairSignerWithSol,
  signAndSendTransaction,
} from './_setup.js';

test('it creates and initializes a new mint account', async (t) => {
  // Given an authority and a mint account.
  const client = createDefaultSolanaClient();
  const authority = await generateKeyPairSignerWithSol(client);
  const mint = await generateKeyPairSigner();

  // When we create and initialize a mint account at this address.
  const space = BigInt(getMintSize());
  const rent = await client.rpc.getMinimumBalanceForRentExemption(space).send();
  const instructions = [
    getCreateAccountInstruction({
      payer: authority,
      newAccount: mint,
      lamports: rent,
      space,
      programAddress: TOKEN_PROGRAM_ADDRESS,
    }),
    getInitializeMintInstruction({
      mint: mint.address,
      decimals: 2,
      mintAuthority: authority.address,
    }),
  ];
  await pipe(
    await createDefaultTransaction(client, authority),
    (tx) => appendTransactionMessageInstructions(instructions, tx),
    (tx) => signAndSendTransaction(client, tx)
  );

  // Then we expect the mint account to exist and have the following data.
  const mintAccount = await fetchMint(client.rpc, mint.address);
  t.like(mintAccount, <Account<Mint>>{
    address: mint.address,
    data: {
      mintAuthority: some(authority.address),
      supply: 0n,
      decimals: 2,
      isInitialized: true,
      freezeAuthority: none(),
    },
  });
});

test('it creates a new mint account with a freeze authority', async (t) => {
  // Given an authority and a mint account.
  const client = createDefaultSolanaClient();
  const [payer, mintAuthority, freezeAuthority, mint] = await Promise.all([
    generateKeyPairSignerWithSol(client),
    generateKeyPairSigner(),
    generateKeyPairSigner(),
    generateKeyPairSigner(),
  ]);

  // When we create and initialize a mint account at this address.
  const space = BigInt(getMintSize());
  const rent = await client.rpc.getMinimumBalanceForRentExemption(space).send();
  const instructions = [
    getCreateAccountInstruction({
      payer,
      newAccount: mint,
      lamports: rent,
      space,
      programAddress: TOKEN_PROGRAM_ADDRESS,
    }),
    getInitializeMintInstruction({
      mint: mint.address,
      decimals: 0,
      mintAuthority: mintAuthority.address,
      freezeAuthority: freezeAuthority.address,
    }),
  ];
  await pipe(
    await createDefaultTransaction(client, payer),
    (tx) => appendTransactionMessageInstructions(instructions, tx),
    (tx) => signAndSendTransaction(client, tx)
  );

  // Then we expect the mint account to exist and have the following data.
  const mintAccount = await fetchMint(client.rpc, mint.address);
  t.like(mintAccount, <Account<Mint>>{
    address: mint.address,
    data: {
      mintAuthority: some(mintAuthority.address),
      freezeAuthority: some(freezeAuthority.address),
    },
  });
});
