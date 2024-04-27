import { createUmi as baseCreateUmi } from '@metaplex-foundation/umi-bundle-tests';

import {
  SYSTEM_PROGRAM_ID,
  createAccount,
  getNonceSize,
  initializeNonceAccount,
  solanaSystem,
} from '../src/index.js';
import { Signer, Umi } from '@metaplex-foundation/umi';

export const createUmi = async () =>
  (await baseCreateUmi()).use(solanaSystem());

export const createNonceAccount = async (
  umi: Umi,
  nonce: Signer,
  nonceAuthority: Signer
) => {
  const space = getNonceSize();
  const rent = await umi.rpc.getRent(getNonceSize());
  await createAccount(umi, {
    newAccount: nonce,
    lamports: rent.basisPoints,
    space,
    programAddress: SYSTEM_PROGRAM_ID,
  })
    .add(
      initializeNonceAccount(umi, {
        nonceAccount: nonce.publicKey,
        nonceAuthority: nonceAuthority.publicKey,
      })
    )
    .sendAndConfirm(umi);
};
