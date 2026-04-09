import { type Address } from '@solana/addresses';
import { getSchemaDecoder } from 'sas-lib';
import { beforeEach, describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { createCredential, createSchema, loadSasProgram, programClient } from './sas-test-utils';

describe('SAS: changeSchemaDescription', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
        loadSasProgram(ctx);
    });

    test('should update schema description', async () => {
        const { authority, credentialPda } = await createCredential(ctx);
        const { schemaPda } = await createSchema(ctx, authority, credentialPda);

        const expectedAccounts = [authority, authority, credentialPda, schemaPda, ctx.SYSTEM_PROGRAM_ADDRESS];
        const ix = await programClient.methods
            .changeSchemaDescription({ description: 'Updated description' })
            .accounts({ authority, credential: credentialPda, payer: authority, schema: schemaPda })
            .instruction();

        expect(ix.accounts?.length).toBe(5);
        expectedAccounts.forEach((expected, i) => {
            expect(ix.accounts?.[i].address).eq(expected);
        });
        await ctx.sendInstruction(ix, [authority]);

        const account = ctx.requireEncodedAccount(schemaPda);
        const schema = getSchemaDecoder().decode(account.data);
        expect(schema.description).toEqual(new TextEncoder().encode('Updated description'));
    });

    test('should throw AccountError when schema is missing', async () => {
        const { authority, credentialPda } = await createCredential(ctx);

        await expect(
            programClient.methods
                .changeSchemaDescription({ description: 'New description' })
                .accounts({
                    authority,
                    credential: credentialPda,
                    payer: authority,
                    schema: undefined as unknown as Address,
                })
                .instruction(),
        ).rejects.toThrow(/Missing account \[schema\]/);
    });

    test('should throw ValidationError when description is invalid', async () => {
        const { authority, credentialPda } = await createCredential(ctx);
        const { schemaPda } = await createSchema(ctx, authority, credentialPda);

        await expect(
            programClient.methods
                .changeSchemaDescription({ description: BigInt(42) as unknown as string })
                .accounts({
                    authority,
                    credential: credentialPda,
                    payer: authority,
                    schema: schemaPda,
                })
                .instruction(),
        ).rejects.toThrow(/Invalid argument "description"/);
    });
});
