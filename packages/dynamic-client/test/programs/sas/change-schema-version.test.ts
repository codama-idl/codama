import { type Address } from '@solana/addresses';
import { deriveSchemaPda, getSchemaDecoder } from 'sas-lib';
import { beforeEach, describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import {
    createCredential,
    createSchema,
    loadSasProgram,
    programClient,
    SCHEMA_DATA_STRING_TYPE,
    SCHEMA_DATA_U8_TYPE,
} from './sas-test-utils';

describe('SAS: changeSchemaVersion', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
        loadSasProgram(ctx);
    });

    test('should create a new version of a schema', async () => {
        const { authority, credentialPda } = await createCredential(ctx);
        const { name, schemaPda: existingSchemaPda } = await createSchema(ctx, authority, credentialPda);

        const [newSchemaPda] = await deriveSchemaPda({ credential: credentialPda, name, version: 2 });

        const expectedAccounts = [
            authority,
            authority,
            credentialPda,
            existingSchemaPda,
            newSchemaPda,
            ctx.SYSTEM_PROGRAM_ADDRESS,
        ];
        const ix = await programClient.methods
            .changeSchemaVersion({
                fieldNames: ['fullName', 'age'],
                layout: new Uint8Array([SCHEMA_DATA_STRING_TYPE, SCHEMA_DATA_U8_TYPE]),
            })
            .accounts({
                authority,
                credential: credentialPda,
                existingSchema: existingSchemaPda,
                newSchema: newSchemaPda,
                payer: authority,
            })
            .instruction();

        expect(ix.accounts?.length).toBe(6);
        expectedAccounts.forEach((expected, i) => {
            expect(ix.accounts?.[i].address).eq(expected);
        });
        await ctx.sendInstruction(ix, [authority]);

        const account = ctx.requireEncodedAccount(newSchemaPda);
        const schema = getSchemaDecoder().decode(account.data);
        expect(schema.layout).toEqual(new Uint8Array([SCHEMA_DATA_STRING_TYPE, SCHEMA_DATA_U8_TYPE]));
        expect(schema.version).toBe(2);
    });

    test('should throw AccountError when existingSchema is missing', async () => {
        const { authority, credentialPda } = await createCredential(ctx);
        const { name, schemaPda: existingSchemaPda } = await createSchema(ctx, authority, credentialPda);
        const [newSchemaPda] = await deriveSchemaPda({ credential: credentialPda, name, version: 2 });

        await expect(
            programClient.methods
                .changeSchemaVersion({ fieldNames: ['field123'], layout: new Uint8Array([12]) })
                .accounts({
                    authority,
                    credential: credentialPda,
                    existingSchema: undefined as unknown as Address,
                    newSchema: newSchemaPda,
                    payer: authority,
                })
                .instruction(),
        ).rejects.toThrow(/Missing account \[existingSchema\]/);

        await expect(
            programClient.methods
                .changeSchemaVersion({ fieldNames: ['field123'], layout: new Uint8Array([12]) })
                .accounts({
                    authority,
                    credential: credentialPda,
                    existingSchema: existingSchemaPda,
                    newSchema: undefined as unknown as Address,
                    payer: authority,
                })
                .instruction(),
        ).rejects.toThrow(/Missing account \[newSchema\]/);
    });

    test('should throw ValidationError when argument is invalid', async () => {
        const { authority, credentialPda } = await createCredential(ctx);
        const { name, schemaPda: existingSchemaPda } = await createSchema(ctx, authority, credentialPda);

        const [newSchemaPda] = await deriveSchemaPda({ credential: credentialPda, name, version: 2 });

        await expect(
            programClient.methods
                .changeSchemaVersion({
                    fieldNames: undefined as unknown as string[],
                    layout: new Uint8Array([SCHEMA_DATA_STRING_TYPE, SCHEMA_DATA_U8_TYPE]),
                })
                .accounts({
                    authority,
                    credential: credentialPda,
                    existingSchema: existingSchemaPda,
                    newSchema: newSchemaPda,
                    payer: authority,
                })
                .instruction(),
        ).rejects.toThrow(/Invalid argument "fieldNames"/);

        await expect(
            programClient.methods
                .changeSchemaVersion({
                    fieldNames: ['test1', 'test2'],
                    layout: 123 as unknown as Uint8Array,
                })
                .accounts({
                    authority,
                    credential: credentialPda,
                    existingSchema: existingSchemaPda,
                    newSchema: newSchemaPda,
                    payer: authority,
                })
                .instruction(),
        ).rejects.toThrow(/Invalid argument "layout"/);
    });
});
