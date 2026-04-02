import { type Address } from '@solana/addresses';
import { getU32Encoder } from '@solana/codecs';
import { deriveSchemaPda, getSchemaDecoder } from 'sas-lib';
import { beforeEach, describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import {
    createCredential,
    loadSasProgram,
    programClient,
    SCHEMA_DATA_STRING_TYPE,
    SCHEMA_DATA_U8_TYPE,
} from './sas-test-utils';

describe('SAS: createSchema', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
        loadSasProgram(ctx);
    });

    test('should create a schema', async () => {
        const { authority, credentialPda } = await createCredential(ctx);
        const name = 'FullNameSchema';
        const [schemaPda] = await deriveSchemaPda({ credential: credentialPda, name, version: 1 });

        const expectedAccounts = [authority, authority, credentialPda, schemaPda, ctx.SYSTEM_PROGRAM_ADDRESS];
        const ix = await programClient.methods
            .createSchema({
                description: 'This is description',
                fieldNames: ['firstName', 'age', 'lastName'],
                layout: new Uint8Array([SCHEMA_DATA_STRING_TYPE, SCHEMA_DATA_U8_TYPE, SCHEMA_DATA_STRING_TYPE]),
                name,
            })
            .accounts({ authority, credential: credentialPda, payer: authority, schema: schemaPda })
            .instruction();

        expect(ix.accounts?.length).toBe(5);
        expectedAccounts.forEach((acc, idx) => {
            expect(ix.accounts?.[idx].address).toBe(acc);
        });
        await ctx.sendInstruction(ix, [authority]);

        const textEncoder = new TextEncoder();
        const account = ctx.requireEncodedAccount(schemaPda);
        const schema = getSchemaDecoder().decode(account.data);
        expect(schema.description).toEqual(textEncoder.encode('This is description'));

        const sizePrefixEncoder = getU32Encoder();
        expect(schema.fieldNames).toEqual(
            new Uint8Array([
                ...sizePrefixEncoder.encode('firstName'.length),
                ...textEncoder.encode('firstName'),
                ...sizePrefixEncoder.encode('age'.length),
                ...textEncoder.encode('age'),
                ...sizePrefixEncoder.encode('lastName'.length),
                ...textEncoder.encode('lastName'),
            ]),
        );
        expect(schema.layout).toEqual(
            new Uint8Array([SCHEMA_DATA_STRING_TYPE, SCHEMA_DATA_U8_TYPE, SCHEMA_DATA_STRING_TYPE]),
        );
    });

    test('should throw AccountError when credential is missing', async () => {
        const authority = await ctx.createFundedAccount();
        const [schemaPda] = await deriveSchemaPda({ credential: authority, name: 'dummy', version: 1 });

        await expect(
            programClient.methods
                .createSchema({ description: '', fieldNames: ['field1'], layout: new Uint8Array([12]), name: 'Test' })
                .accounts({
                    authority,
                    credential: undefined as unknown as Address,
                    payer: authority,
                    schema: schemaPda,
                })
                .instruction(),
        ).rejects.toThrow(/Missing required account: credential/);
    });

    test('should throw AccountError when schema is missing', async () => {
        const { authority, credentialPda } = await createCredential(ctx);

        await expect(
            programClient.methods
                .createSchema({ description: '', fieldNames: ['field1'], layout: new Uint8Array([12]), name: 'Test' })
                .accounts({
                    authority,
                    credential: credentialPda,
                    payer: authority,
                    schema: undefined as unknown as Address,
                })
                .instruction(),
        ).rejects.toThrow(/Missing required account: schema/);
    });

    test('should throw ArgumentError when argument is invalid', async () => {
        const { authority, credentialPda } = await createCredential(ctx);
        const [schemaPda] = await deriveSchemaPda({ credential: credentialPda, name: 'dummy', version: 1 });

        await expect(
            programClient.methods
                .createSchema({
                    description: '',
                    fieldNames: ['field1'],
                    layout: new Uint8Array([12]),
                    name: undefined as unknown as string,
                })
                .accounts({ authority, credential: credentialPda, payer: authority, schema: schemaPda })
                .instruction(),
        ).rejects.toThrow(/Invalid argument "name"/);

        await expect(
            programClient.methods
                .createSchema({
                    description: '',
                    fieldNames: { a: 42 } as unknown as string[],
                    layout: new Uint8Array([12]),
                    name: '234',
                })
                .accounts({ authority, credential: credentialPda, payer: authority, schema: schemaPda })
                .instruction(),
        ).rejects.toThrow(/Invalid argument "fieldNames"/);
    });
});
