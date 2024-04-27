import test from 'ava';
import { SYSTEM_PROGRAM_ID, createAccount } from '../src/index.js';
import { createUmi } from './_setup.js';
import { MaybeRpcAccount, generateSigner } from '@metaplex-foundation/umi';

test('it creates a new empty account', async (t) => {
  // Given we have a newly generated account keypair to create with 42 bytes of space.
  const umi = await createUmi();
  const space = 42;
  const rent = await umi.rpc.getRent(space);
  const newAccount = generateSigner(umi);

  // When we call createAccount in a transaction.
  await createAccount(umi, {
    newAccount,
    space,
    lamports: rent.basisPoints,
    programAddress: SYSTEM_PROGRAM_ID,
  }).sendAndConfirm(umi);

  // Then we expect the following account data.
  const fetchedAccount = await umi.rpc.getAccount(newAccount.publicKey);
  t.like(fetchedAccount, <MaybeRpcAccount>{
    executable: false,
    lamports: rent,
    owner: SYSTEM_PROGRAM_ID,
    publicKey: newAccount.publicKey,
    data: new Uint8Array(Array.from({ length: 42 }, () => 0)),
    exists: true,
  });
});
