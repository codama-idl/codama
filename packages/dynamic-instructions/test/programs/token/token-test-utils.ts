import type { Address } from '@solana/addresses';

import type { SystemProgramClient } from '../generated/system-program-idl-types';
import type { TokenProgramClient } from '../generated/token-idl-types';
import { createTestProgramClient, SvmTestContext } from '../test-utils';

export const tokenClient = createTestProgramClient<TokenProgramClient>('token-idl.json');
export const systemClient = createTestProgramClient<SystemProgramClient>('system-program-idl.json');

export const SPL_TOKEN_MINT_SIZE = 82;
export const SPL_TOKEN_ACCOUNT_SIZE = 165;
export const SPL_TOKEN_MULTISIG_SIZE = 355;

export async function createMint(
    ctx: SvmTestContext,
    payer: Address,
    mint: Address,
    mintAuthority: Address,
    freezeAuthority?: Address,
): Promise<void> {
    const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(SPL_TOKEN_MINT_SIZE));
    const createMintAccountIx = await systemClient.methods
        .createAccount({ lamports, programAddress: tokenClient.programAddress, space: SPL_TOKEN_MINT_SIZE })
        .accounts({ newAccount: mint, payer })
        .instruction();
    ctx.sendInstruction(createMintAccountIx, [payer, mint]);

    const initializeMintIx = await tokenClient.methods
        .initializeMint({ decimals: 9, freezeAuthority: freezeAuthority ?? null, mintAuthority })
        .accounts({ mint })
        .instruction();
    ctx.sendInstruction(initializeMintIx, [payer]);
}

export async function createTokenAccount(
    ctx: SvmTestContext,
    payer: Address,
    account: Address,
    mint: Address,
    owner: Address,
): Promise<void> {
    const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(SPL_TOKEN_ACCOUNT_SIZE));
    const createAccountIx = await systemClient.methods
        .createAccount({ lamports, programAddress: tokenClient.programAddress, space: SPL_TOKEN_ACCOUNT_SIZE })
        .accounts({ newAccount: account, payer })
        .instruction();

    const initAccountIx = await tokenClient.methods
        .initializeAccount()
        .accounts({ account, mint, owner })
        .instruction();

    ctx.sendInstructions([createAccountIx, initAccountIx], [payer, account]);
}
