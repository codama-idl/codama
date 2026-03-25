import type { Address } from '@solana/addresses';

import type { SplAssociatedTokenAccountProgramClient } from '../generated/associated-token-account-idl-types';
import type { SystemProgramClient } from '../generated/system-program-idl-types';
import type { TokenProgramClient } from '../generated/token-idl-types';
import { createTestProgramClient, SvmTestContext } from '../test-utils';

export const ataClient = createTestProgramClient<SplAssociatedTokenAccountProgramClient>(
    'associated-token-account-idl.json',
);
export const tokenClient = createTestProgramClient<TokenProgramClient>('token-idl.json');
export const systemClient = createTestProgramClient<SystemProgramClient>('system-program-idl.json');

const SPL_TOKEN_MINT_SIZE = 82n;

export async function createMint(
    ctx: SvmTestContext,
    payer: Address,
    mint: Address,
    mintAuthority: Address,
): Promise<void> {
    const lamports = ctx.getMinimumBalanceForRentExemption(SPL_TOKEN_MINT_SIZE);
    const createMintAccountIx = await systemClient.methods
        .createAccount({ lamports, programAddress: tokenClient.programAddress, space: SPL_TOKEN_MINT_SIZE })
        .accounts({ newAccount: mint, payer })
        .instruction();
    ctx.sendInstruction(createMintAccountIx, [payer, mint]);

    const initializeMintIx = await tokenClient.methods
        .initializeMint({ decimals: 9, freezeAuthority: null, mintAuthority })
        .accounts({ mint })
        .instruction();
    ctx.sendInstruction(initializeMintIx, [payer]);
}
