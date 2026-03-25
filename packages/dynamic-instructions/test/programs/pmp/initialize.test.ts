import { type Address } from '@solana/addresses';
import type { Some } from '@solana/codecs';
import { AccountDiscriminator, Compression, DataSource, Encoding, Format } from '@solana-program/program-metadata';
import { beforeEach, describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import {
    decodeBufferAccount,
    decodeMetadataAccount,
    loadPmpProgram,
    PMP_PROGRAM_ID,
    programClient,
    setupCanonicalPda,
    setupNonCanonicalPda,
} from './helpers';

describe('Program Metadata: initialize', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
        loadPmpProgram(ctx, programClient.programAddress);
    });

    test('should initialize canonical metadata with direct data (ifTrue condition branch)', async () => {
        const seed = 'idl';
        const { authority, programAddress, programDataAddress, pda: metadataPda } = await setupCanonicalPda(ctx, seed);

        const testData = new TextEncoder().encode('{"name":"test"}');

        const expectedAccounts = [
            metadataPda,
            authority,
            programAddress,
            programDataAddress,
            ctx.SYSTEM_PROGRAM_ADDRESS,
        ];

        const ix = await programClient.methods
            .initialize({
                compression: 'none',
                data: testData,
                dataSource: 'direct',
                encoding: 'utf8',
                format: 'json',
                seed,
            })
            .accounts({
                authority,
                program: programAddress,
                programData: programDataAddress,
            })
            .instruction();

        expect(ix.accounts?.length).toBe(5);
        ix.accounts?.forEach((ixAccount, i) => {
            expect(expectedAccounts[i], `Invalid account: [${i}]`).toBe(ixAccount.address);
        });

        ctx.sendInstruction(ix, [authority]);

        const account = ctx.requireEncodedAccount(metadataPda);
        expect(account.owner).toBe(PMP_PROGRAM_ID);

        const metadata = decodeMetadataAccount(account.data);
        expect(metadata.canonical).toBe(true);
        expect(metadata.program).toBe(programAddress);
        // Canonical metadata stores authority as zero (None)
        expect(metadata.authority).toEqual({ __option: 'None' });
        expect(metadata.seed).toBe(seed);

        const writtenData = metadata.data.slice(0, testData.length);
        expect(writtenData).toEqual(testData);
    });

    test('should initialize non-canonical metadata (ifFalse condition branch)', async () => {
        const seed = 'idl';
        const { authority, programAddress, pda: metadataPda } = await setupNonCanonicalPda(ctx, seed);

        const testData = new TextEncoder().encode('non-canonical data');

        const expectedAccounts = [
            metadataPda,
            authority,
            programAddress,
            programClient.programAddress, // with "programId" optionalAccountStrategy address is resolved to root.programId
            ctx.SYSTEM_PROGRAM_ADDRESS,
        ];

        const ix = await programClient.methods
            .initialize({
                compression: 'none',
                data: testData,
                dataSource: 'direct',
                encoding: 'utf8',
                format: 'json',
                seed,
            })
            .accounts({
                authority,
                program: programAddress,
                programData: null, // this should use ifFalse branch in conditionalValueNode
            })
            .instruction();

        expect(ix.accounts?.length).toBe(5);
        ix.accounts?.forEach((ixAccount, i) => {
            expect(expectedAccounts[i], `Invalid account: [${i}]`).toBe(ixAccount.address);
        });

        ctx.sendInstruction(ix, [authority]);

        const account = ctx.requireEncodedAccount(metadataPda);
        expect(account.owner).toBe(PMP_PROGRAM_ID);

        const metadata = decodeMetadataAccount(account.data);
        expect(metadata.discriminator).toBe(AccountDiscriminator.Metadata);
        expect(metadata.canonical).toBe(false);
        expect(metadata.program).toBe(programAddress);
        expect((metadata.authority as Some<Address>).value).toBe(authority);
        expect(metadata.seed).toBe(seed);

        const writtenData = metadata.data.slice(0, testData.length);
        expect(writtenData).toEqual(testData);
    });

    test('should resolve optional null system_program account according on optionalAccountStrategy', async () => {
        const seed = 'idl';
        const { authority, programAddress, programDataAddress, pda: metadataPda } = await setupCanonicalPda(ctx, seed);

        const testData = new TextEncoder().encode('{"name":"test"}');

        const expectedAccounts = [
            metadataPda,
            authority,
            programAddress,
            programDataAddress,
            programClient.programAddress, // expect root.programAddress based on optionalAccountStrategy
        ];

        const ix = await programClient.methods
            .initialize({
                compression: 'none',
                data: testData,
                dataSource: 'direct',
                encoding: 'utf8',
                format: 'json',
                seed,
            })
            .accounts({
                authority,
                program: programAddress,
                programData: programDataAddress,
                system: null, // explicit null should resolve to root.programAddress
            })
            .instruction();

        expect(ix.accounts?.length).toBe(5);
        ix.accounts?.forEach((ixAccount, i) => {
            expect(expectedAccounts[i], `Invalid account: [${i}]`).toBe(ixAccount.address);
        });
    });

    test('should initialize metadata from pre-allocated buffer', async () => {
        const seed = 'idl';
        const { authority, programAddress, programDataAddress, pda: metadataPda } = await setupCanonicalPda(ctx, seed);

        // Allocate the metadata PDA as a canonical buffer
        const allocateIx = await programClient.methods
            .allocate({ seed })
            .accounts({
                authority,
                buffer: metadataPda,
                program: programAddress,
                programData: programDataAddress,
            })
            .instruction();

        // Write data to the buffer at the metadata PDA address
        const testData = new TextEncoder().encode('{"from":"buffer"}');
        const writeIx = await programClient.methods
            .write({ data: testData, offset: 0 })
            .accounts({
                authority,
                buffer: metadataPda,
                sourceBuffer: null,
            })
            .instruction();

        ctx.sendInstructions([allocateIx, writeIx], [authority]);

        // Verify the buffer was written at the metadata PDA
        const bufferAccount = ctx.requireEncodedAccount(metadataPda);
        const buffer = decodeBufferAccount(bufferAccount.data);
        expect(buffer.discriminator).toBe(AccountDiscriminator.Buffer);

        // Now initialize — the program sees the Buffer discriminator and uses existing data
        const initializeIx = await programClient.methods
            .initialize({
                compression: 'none',
                data: null,
                dataSource: 'direct',
                encoding: 'utf8',
                format: 'json',
                seed,
            })
            .accounts({
                authority,
                program: programAddress,
                programData: programDataAddress,
            })
            .instruction();

        ctx.sendInstruction(initializeIx, [authority]);

        const account = ctx.requireEncodedAccount(metadataPda);
        expect(account.owner).toBe(PMP_PROGRAM_ID);

        const metadata = decodeMetadataAccount(account.data);
        expect(metadata.discriminator).toBe(AccountDiscriminator.Metadata);
        expect(metadata.canonical).toBe(true);
        expect(metadata.program).toBe(programAddress);
        expect(metadata.authority).toEqual({ __option: 'None' });
        const writtenData = metadata.data.slice(0, testData.length);
        expect(writtenData).toEqual(testData);
    });

    test('should initialize with different encoding and format', async () => {
        const seed = 'config';
        const { authority, programAddress, programDataAddress, pda: metadataPda } = await setupCanonicalPda(ctx, seed);

        const testData = new TextEncoder().encode('dG9tbCBkYXRh');

        const ix = await programClient.methods
            .initialize({
                compression: 'zlib',
                data: testData,
                dataSource: 'url',
                encoding: 'base64',
                format: 'toml',
                seed,
            })
            .accounts({
                authority,
                program: programAddress,
                programData: programDataAddress,
            })
            .instruction();

        ctx.sendInstruction(ix, [authority]);

        const account = ctx.requireEncodedAccount(metadataPda);
        expect(account.owner).toBe(PMP_PROGRAM_ID);

        const metadata = decodeMetadataAccount(account.data);
        expect(metadata.discriminator).toBe(AccountDiscriminator.Metadata);
        expect(metadata.canonical).toBe(true);
        expect(metadata.encoding).toBe(Encoding.Base64);
        expect(metadata.compression).toBe(Compression.Zlib);
        expect(metadata.format).toBe(Format.Toml);
        expect(metadata.dataSource).toBe(DataSource.Url);

        const writtenData = metadata.data.slice(0, testData.length);
        expect(writtenData).toEqual(testData);
    });

    test('should throw AccountError when authority is missing for non-canonical metadata', async () => {
        const testProgramAddress = ctx.createAccount();
        await expect(
            programClient.methods
                .initialize({
                    compression: 'none',
                    data: null,
                    dataSource: 'direct',
                    encoding: 'utf8',
                    format: 'json',
                    seed: 'idl',
                })
                .accounts({
                    // Simulate invalid required authority account
                    authority: undefined as unknown as Address,
                    program: testProgramAddress,
                    programData: null,
                })
                .instruction(),
        ).rejects.toThrow(/Missing required account: authority/);
    });

    test('should throw AccountError when required program account is missing', async () => {
        const authority = ctx.createFundedAccount();

        await expect(
            programClient.methods
                .initialize({
                    compression: 'none',
                    data: null,
                    dataSource: 'direct',
                    encoding: 'utf8',
                    format: 'json',
                    seed: 'idl',
                })
                .accounts({
                    authority,
                    // Simulate invalid required program account
                    program: undefined as unknown as Address,
                    programData: null,
                })
                .instruction(),
        ).rejects.toThrow(/Missing required account: program/);
    });

    test('should throw ArgumentError when missing required seed argument', async () => {
        const authority = ctx.createFundedAccount();
        const testProgramAddress = ctx.createAccount();

        await expect(
            programClient.methods
                .initialize({
                    compression: 'none',
                    data: null,
                    dataSource: 'direct',
                    encoding: 'utf8',
                    format: 'json',
                    // Simulate invalid seed
                    seed: undefined as unknown as string,
                })
                .accounts({
                    authority,
                    program: testProgramAddress,
                    programData: null,
                })
                .instruction(),
        ).rejects.toThrow(/Invalid argument "seed", value: undefined/);
    });
});
