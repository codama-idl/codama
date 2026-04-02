import { type Address } from '@solana/addresses';
import { getSchemaDecoder } from 'sas-lib';
import { beforeEach, describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createCredential, createSchema, loadSasProgram, programClient } from './sas-test-utils';

describe('SAS: changeSchemaStatus', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
        loadSasProgram(ctx);
    });

    test('should pause a schema', async () => {
        const { authority, credentialPda } = await createCredential(ctx);
        const { schemaPda } = await createSchema(ctx, authority, credentialPda);

        const expectedAccounts = [authority, credentialPda, schemaPda];
        const ix = await programClient.methods
            .changeSchemaStatus({ isPaused: true })
            .accounts({ authority, credential: credentialPda, schema: schemaPda })
            .instruction();

        expect(ix.accounts?.length).toBe(3);
        expectedAccounts.forEach((expected, i) => {
            expect(ix.accounts?.[i].address).eq(expected);
        });
        await ctx.sendInstruction(ix, [authority]);

        const account = ctx.requireEncodedAccount(schemaPda);
        const schema = getSchemaDecoder().decode(account.data);
        expect(schema.isPaused).toBe(true);
    });

    test('should unpause a schema', async () => {
        const { authority, credentialPda } = await createCredential(ctx);
        const { schemaPda } = await createSchema(ctx, authority, credentialPda);

        const pauseIx = await programClient.methods
            .changeSchemaStatus({ isPaused: true })
            .accounts({ authority, credential: credentialPda, schema: schemaPda })
            .instruction();

        await ctx.sendInstruction(pauseIx, [authority]);

        const unpauseIx = await programClient.methods
            .changeSchemaStatus({ isPaused: false })
            .accounts({ authority, credential: credentialPda, schema: schemaPda })
            .instruction();

        await ctx.sendInstruction(unpauseIx, [authority]);

        const account = ctx.requireEncodedAccount(schemaPda);
        const schema = getSchemaDecoder().decode(account.data);
        expect(schema.isPaused).toBe(false);
    });

    test('should build correct instruction with 3 accounts', async () => {
        const { authority, credentialPda } = await createCredential(ctx);
        const { schemaPda } = await createSchema(ctx, authority, credentialPda);

        const ix = await programClient.methods
            .changeSchemaStatus({ isPaused: true })
            .accounts({ authority, credential: credentialPda, schema: schemaPda })
            .instruction();

        expect(ix.accounts?.length).toBe(3);
    });

    test('should throw AccountError when credential is missing', async () => {
        const { authority, credentialPda } = await createCredential(ctx);
        const { schemaPda } = await createSchema(ctx, authority, credentialPda);

        await expect(
            programClient.methods
                .changeSchemaStatus({ isPaused: true })
                .accounts({ authority, credential: undefined as unknown as Address, schema: schemaPda })
                .instruction(),
        ).rejects.toThrow(/Missing required account: credential/);
    });

    test('should throw ArgumentError when isPaused is invalid', async () => {
        const { authority, credentialPda } = await createCredential(ctx);
        const { schemaPda } = await createSchema(ctx, authority, credentialPda);

        await expect(
            programClient.methods
                .changeSchemaStatus({ isPaused: 'yes' as unknown as boolean })
                .accounts({ authority, credential: credentialPda, schema: schemaPda })
                .instruction(),
        ).rejects.toThrow(/Invalid argument "isPaused"/);
    });
});
