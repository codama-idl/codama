import { type Address } from '@solana/addresses';
import { deriveSasAuthorityAddress, deriveSchemaMintPda } from 'sas-lib';
import { beforeEach, describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createCredential, createSchema, getSchemaMintSize, loadSasProgram, programClient } from './sas-test-utils';

describe('SAS: tokenizeSchema', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext({ defaultPrograms: true });
        loadSasProgram(ctx);
    });

    test('should tokenize a schema and create a mint', async () => {
        const { authority, credentialPda } = await createCredential(ctx);
        const { schemaPda } = await createSchema(ctx, authority, credentialPda);

        const sasPda = await deriveSasAuthorityAddress();
        const [schemaMintPda] = await deriveSchemaMintPda({ schema: schemaPda });
        const maxSize = BigInt(getSchemaMintSize(sasPda, schemaMintPda));

        const expectedAccounts = [
            authority,
            authority,
            credentialPda,
            schemaPda,
            schemaMintPda,
            sasPda,
            ctx.SYSTEM_PROGRAM_ADDRESS,
            ctx.TOKEN_2022_PROGRAM_ADDRESS,
        ];
        const ix = await programClient.methods
            .tokenizeSchema({ maxSize })
            .accounts({
                authority,
                credential: credentialPda,
                mint: schemaMintPda,
                payer: authority,
                sasPda,
                schema: schemaPda,
                tokenProgram: ctx.TOKEN_2022_PROGRAM_ADDRESS,
            })
            .instruction();

        expect(ix.accounts?.length).toBe(8);
        expectedAccounts.forEach((expected, i) => {
            if (!ix?.accounts?.[i]) {
                throw new Error(`Expected instruction accounts to be defined at index ${i}`);
            }
            expect(ix.accounts[i].address).eq(expected);
        });

        ctx.sendInstruction(ix, [authority]);

        const account = ctx.requireEncodedAccount(schemaMintPda);
        expect(account).not.toBeNull();
        expect(account.data.length).greaterThan(0);
    });

    test('should throw AccountError when mint is missing', async () => {
        const { authority, credentialPda } = await createCredential(ctx);
        const { schemaPda } = await createSchema(ctx, authority, credentialPda);

        const sasPda = await deriveSasAuthorityAddress();
        const [schemaMintPda] = await deriveSchemaMintPda({ schema: schemaPda });
        const maxSize = getSchemaMintSize(sasPda, schemaMintPda); // should work as number

        await expect(
            programClient.methods
                .tokenizeSchema({ maxSize })
                .accounts({
                    authority,
                    credential: credentialPda,
                    mint: undefined as unknown as Address,
                    payer: authority,
                    sasPda,
                    schema: schemaPda,
                    tokenProgram: ctx.TOKEN_2022_PROGRAM_ADDRESS,
                })
                .instruction(),
        ).rejects.toThrow(/Missing required account: mint/);
    });

    test('should throw AccountError when maxSize arg is missing', async () => {
        const { authority, credentialPda } = await createCredential(ctx);
        const { schemaPda } = await createSchema(ctx, authority, credentialPda);

        const sasPda = await deriveSasAuthorityAddress();
        const [schemaMintPda] = await deriveSchemaMintPda({ schema: schemaPda });

        await expect(
            programClient.methods
                .tokenizeSchema({ maxSize: 'jondoe' as unknown as bigint })
                .accounts({
                    authority,
                    credential: credentialPda,
                    mint: schemaMintPda,
                    payer: authority,
                    sasPda,
                    schema: schemaPda,
                    tokenProgram: ctx.TOKEN_2022_PROGRAM_ADDRESS,
                })
                .instruction(),
        ).rejects.toThrow(/Invalid argument "maxSize"/);
    });
});
