import { some } from '@solana/codecs';
import { AccountState, getMintDecoder, getMintSize } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { systemClient, token2022Client } from './token-2022-test-utils';

describe('Token 2022 Program: initializeDefaultAccountState', () => {
    test('should initialize default account state extension', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const mint = ctx.createAccount();
        const freezeAuthority = ctx.createFundedAccount();

        const size = getMintSize([{ __kind: 'DefaultAccountState', state: AccountState.Frozen }]);
        const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(size));
        const createAccountIx = await systemClient.methods
            .createAccount({ lamports, programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS, space: size })
            .accounts({ newAccount: mint, payer })
            .instruction();

        const initDefaultStateIx = await token2022Client.methods
            .initializeDefaultAccountState({ state: 'frozen' })
            .accounts({ mint })
            .instruction();

        const initMintIx = await token2022Client.methods
            .initializeMint2({ decimals: 9, freezeAuthority, mintAuthority: payer })
            .accounts({ mint })
            .instruction();

        ctx.sendInstructions([createAccountIx, initDefaultStateIx, initMintIx], [payer, mint]);

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.mintAuthority).toEqual({ __option: 'Some', value: payer });
        expect(mintData.freezeAuthority).toEqual({ __option: 'Some', value: freezeAuthority });
        expect(mintData.extensions).toMatchObject(
            some([{ __kind: 'DefaultAccountState', state: AccountState.Frozen }]),
        );
    });
});
