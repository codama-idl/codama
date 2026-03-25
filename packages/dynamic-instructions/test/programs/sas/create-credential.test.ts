import { type Address } from '@solana/addresses';
import { deriveCredentialPda, getCredentialDecoder } from 'sas-lib';
import { beforeEach, describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { loadSasProgram, programClient } from './sas-test-utils';

describe('SAS: createCredential', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
        loadSasProgram(ctx);
    });

    test('should create a credential with multiple signers', async () => {
        const authority = ctx.createFundedAccount();
        const signer2 = ctx.createAccount();
        const signer3 = ctx.createAccount();
        const name = 'MultiSignerCredential';

        const [credentialPda] = await deriveCredentialPda({ authority, name });

        const expectedAccounts = [authority, credentialPda, authority, ctx.SYSTEM_PROGRAM_ADDRESS];
        const ix = await programClient.methods
            .createCredential({ name, signers: [authority, signer2, signer3] })
            .accounts({ authority, credential: credentialPda, payer: authority })
            .instruction();

        expect(ix.accounts?.length).toBe(4);
        expectedAccounts.forEach((expected, i) => {
            expect(ix.accounts?.[i].address).eq(expected);
        });
        ctx.sendInstruction(ix, [authority]);

        const account = ctx.requireEncodedAccount(credentialPda);
        const credential = getCredentialDecoder().decode(account.data);

        expect(credential).toMatchObject({
            authority,
            authorizedSigners: [authority, signer2, signer3],
            name: new Uint8Array(Buffer.from(name)),
        });
    });

    test('should throw AccountError when credential is missing', async () => {
        const authority = ctx.createFundedAccount();

        await expect(
            programClient.methods
                .createCredential({ name: 'Test', signers: [authority] })
                .accounts({ authority, credential: undefined as unknown as Address, payer: authority })
                .instruction(),
        ).rejects.toThrow(/Missing required account: credential/);
    });

    test('should throw ArgumentError when name is missing', async () => {
        const authority = ctx.createFundedAccount();
        const [credentialPda] = await deriveCredentialPda({ authority, name: 'dummy' });

        await expect(
            programClient.methods
                .createCredential({ name: undefined as unknown as string, signers: [authority] })
                .accounts({ authority, credential: credentialPda, payer: authority })
                .instruction(),
        ).rejects.toThrow(/Invalid argument "name"/);
    });
});
