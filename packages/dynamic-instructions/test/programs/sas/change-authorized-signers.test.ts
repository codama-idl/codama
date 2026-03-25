import { type Address } from '@solana/addresses';
import { getCredentialDecoder } from 'sas-lib';
import { beforeEach, describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createCredential, loadSasProgram, programClient } from './sas-test-utils';

describe('SAS: changeAuthorizedSigners', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
        loadSasProgram(ctx);
    });

    test('should replace authorized signers with a new set', async () => {
        const { authority, credentialPda } = await createCredential(ctx);
        const newSigner1 = ctx.createAccount();
        const newSigner2 = ctx.createAccount();

        const expectedAccounts = [authority, authority, credentialPda, ctx.SYSTEM_PROGRAM_ADDRESS];
        const ix = await programClient.methods
            .changeAuthorizedSigners({ signers: [newSigner1, newSigner2] })
            .accounts({ authority, credential: credentialPda, payer: authority })
            .instruction();

        expect(ix.accounts?.length).toBe(4);
        expectedAccounts.forEach((expected, i) => {
            expect(ix.accounts?.[i].address).eq(expected);
        });
        ctx.sendInstruction(ix, [authority]);

        const account = ctx.requireEncodedAccount(credentialPda);
        const credential = getCredentialDecoder().decode(account.data);
        expect(credential.authorizedSigners).toEqual([newSigner1, newSigner2]);
    });

    test('should throw AccountError when credential is missing', async () => {
        const { authority } = await createCredential(ctx);

        await expect(
            programClient.methods
                .changeAuthorizedSigners({ signers: [authority] })
                .accounts({ authority, credential: undefined as unknown as Address, payer: authority })
                .instruction(),
        ).rejects.toThrow(/Missing required account: credential/);
    });

    test('should throw ValidationError when signers arg is invalid', async () => {
        const { authority, credentialPda } = await createCredential(ctx);

        await expect(
            programClient.methods
                .changeAuthorizedSigners({ signers: { a: 42 } as unknown as Address[] })
                .accounts({ authority, credential: credentialPda, payer: authority })
                .instruction(),
        ).rejects.toThrow(/Invalid argument "signers"/);
    });
});
