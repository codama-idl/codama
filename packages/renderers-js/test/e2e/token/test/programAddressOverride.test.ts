import { address, generateKeyPairSigner } from '@solana/kit';
import test from 'ava';
import { getInitializeMintInstruction } from '../src/index.js';

test('it can override the program address of an instruction', async (t) => {
  // Note: this test does not need to run the generated instruction

  // Given: a program address that we want to create instructions for
  const TOKEN_22_PROGRAM_ADDRESS = address(
    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
  );

  // When we generate an initialize mint instruction with the program address
  const mintAddress = (await generateKeyPairSigner()).address;
  const mintAuthorityAddress = (await generateKeyPairSigner()).address;

  const mintInstruction = getInitializeMintInstruction(
    {
      mint: mintAddress,
      decimals: 2,
      mintAuthority: mintAuthorityAddress,
    },
    { programAddress: TOKEN_22_PROGRAM_ADDRESS }
  );

  // Then: the generated instruction has the correct program address
  t.is(mintInstruction.programAddress, TOKEN_22_PROGRAM_ADDRESS);
});
