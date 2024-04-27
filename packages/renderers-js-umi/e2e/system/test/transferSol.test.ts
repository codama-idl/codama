import test from 'ava';
import { transferSol } from '../src/index.js';
import { createUmi } from './_setup.js';
import { generateSignerWithSol } from '@metaplex-foundation/umi-bundle-tests';
import {
  generateSigner,
  isEqualToAmount,
  lamports,
  sol,
} from '@metaplex-foundation/umi';

test('it transfers SOL from one account to another', async (t) => {
  // Given a source account with 3 SOL and a destination account with no SOL.
  const umi = await createUmi();
  const source = await generateSignerWithSol(umi, sol(3));
  const destination = generateSigner(umi).publicKey;

  // When the source account transfers 1 SOL to the destination account.
  await transferSol(umi, {
    source,
    destination,
    amount: sol(1).basisPoints,
  }).sendAndConfirm(umi);

  // Then the source account now has roughly 2 SOL (minus the transaction fee).
  const sourceBalance = await umi.rpc.getBalance(source.publicKey);
  t.true(isEqualToAmount(sourceBalance, sol(2), lamports(100_000)));

  // And the destination account has exactly 1 SOL.
  t.true(isEqualToAmount(await umi.rpc.getBalance(destination), sol(1)));
});
