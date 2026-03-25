import type { Address } from '@solana/addresses';
import type { Some } from '@solana/codecs';
import { Compression, DataSource, Encoding, Format } from '@solana-program/program-metadata';
import { beforeEach, describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import {
    allocateBufferAccount,
    decodeMetadataAccount,
    initializeCanonicalMetadata,
    initializeNonCanonicalMetadata,
    loadPmpProgram,
    PMP_PROGRAM_ID,
    programClient,
} from './helpers';

describe('Program Metadata: setData', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
        loadPmpProgram(ctx, programClient.programAddress);
    });

    test('should update canonical metadata with inline data', async () => {
        const {
            authority,
            programAddress,
            programDataAddress,
            pda: metadataPda,
        } = await initializeCanonicalMetadata(ctx, { data: new TextEncoder().encode('{"name":"initial"}') });

        // Verify initial state
        const accountBefore = ctx.requireEncodedAccount(metadataPda);
        const metadataBefore = decodeMetadataAccount(accountBefore.data);
        expect(metadataBefore.encoding).toBe(Encoding.Utf8);
        expect(metadataBefore.format).toBe(Format.Json);

        // Update metadata with new data and properties
        const newData = new TextEncoder().encode('{"name":"updated"}');
        const expectedAccounts = [metadataPda, authority, PMP_PROGRAM_ID, programAddress, programDataAddress];

        const setDataIx = await programClient.methods
            .setData({
                compression: 'zlib',
                data: newData,
                dataSource: 'direct',
                encoding: 'utf8',
                format: 'json',
            })
            .accounts({
                authority,
                buffer: null,
                metadata: metadataPda,
                program: programAddress,
                programData: programDataAddress,
            })
            .instruction();

        expect(setDataIx.accounts?.length).toBe(5);
        setDataIx.accounts?.forEach((ixAccount, i) => {
            expect(expectedAccounts[i], `Invalid account: [${i}]`).toBe(ixAccount.address);
        });

        ctx.sendInstruction(setDataIx, [authority]);

        // Verify metadata updated
        const accountAfter = ctx.requireEncodedAccount(metadataPda);
        const metadataAfter = decodeMetadataAccount(accountAfter.data);

        const writtenData = metadataAfter.data.slice(0, newData.length);
        expect(writtenData).toEqual(newData);
        expect(metadataAfter.encoding).toBe(Encoding.Utf8);
        expect(metadataAfter.compression).toBe(Compression.Zlib);
        expect(metadataAfter.format).toBe(Format.Json);
        expect(metadataAfter.dataSource).toBe(DataSource.Direct);

        // Unchanged fields
        expect(metadataAfter.canonical).toBe(true);
        expect(metadataAfter.program).toBe(programAddress);
        expect(metadataAfter.authority).toEqual({ __option: 'None' });
        expect(metadataAfter.seed).toBe('idl');
        expect(metadataAfter.mutable).toBe(true);
    });

    test('should update canonical metadata from buffer', async () => {
        const feePayer = ctx.createFundedAccount();
        const {
            authority,
            programAddress,
            programDataAddress,
            pda: metadataPda,
        } = await initializeCanonicalMetadata(ctx, { data: new TextEncoder().encode('{"name":"initial"}') });

        const { bufferAccount } = await allocateBufferAccount(ctx);

        const bufferData = new TextEncoder().encode('{"from":"buffer"}');
        const writeBufferIx = await programClient.methods
            .write({ data: bufferData, offset: 0 })
            .accounts({
                authority: bufferAccount,
                buffer: bufferAccount,
                sourceBuffer: null,
            })
            .instruction();

        ctx.sendInstruction(writeBufferIx, [feePayer, bufferAccount]);

        // Update metadata from buffer
        const expectedAccounts = [metadataPda, authority, bufferAccount, programAddress, programDataAddress];

        const setDataIx = await programClient.methods
            .setData({
                compression: 'none',
                data: null,
                dataSource: 'direct',
                encoding: 'utf8',
                format: 'json',
            })
            .accounts({
                authority,
                buffer: bufferAccount,
                metadata: metadataPda,
                program: programAddress,
                programData: programDataAddress,
            })
            .instruction();

        expect(setDataIx.accounts?.length).toBe(5);
        setDataIx.accounts?.forEach((ixAccount, i) => {
            expect(expectedAccounts[i], `Invalid account: [${i}]`).toBe(ixAccount.address);
        });

        ctx.sendInstruction(setDataIx, [authority]);

        // Verify metadata data matches buffer
        const accountAfter = ctx.requireEncodedAccount(metadataPda);
        const metadataAfter = decodeMetadataAccount(accountAfter.data);

        const writtenData = metadataAfter.data.slice(0, bufferData.length);
        expect(writtenData).toEqual(bufferData);
    });

    test('should update non-canonical metadata with inline data', async () => {
        const {
            authority,
            programAddress,
            pda: metadataPda,
        } = await initializeNonCanonicalMetadata(ctx, {
            data: new TextEncoder().encode('non-canonical initial'),
        });

        // Verify non-canonical
        const accountBefore = ctx.requireEncodedAccount(metadataPda);
        const metadataBefore = decodeMetadataAccount(accountBefore.data);
        expect(metadataBefore.canonical).toBe(false);
        expect((metadataBefore.authority as Some<Address>).value).toBe(authority);

        // Update non-canonical metadata
        const newData = new TextEncoder().encode('non-canonical updated');
        const expectedAccounts = [metadataPda, authority, PMP_PROGRAM_ID, programAddress, PMP_PROGRAM_ID];

        const setDataIx = await programClient.methods
            .setData({
                compression: 'gzip',
                data: newData,
                dataSource: 'direct',
                encoding: 'utf8',
                format: 'json',
            })
            .accounts({
                authority,
                buffer: null,
                metadata: metadataPda,
                program: programAddress,
                programData: null,
            })
            .instruction();

        expect(setDataIx.accounts?.length).toBe(5);
        setDataIx.accounts?.forEach((ixAccount, i) => {
            expect(expectedAccounts[i], `Invalid account: [${i}]`).toBe(ixAccount.address);
        });

        ctx.sendInstruction(setDataIx, [authority]);

        const accountAfter = ctx.requireEncodedAccount(metadataPda);
        const metadataAfter = decodeMetadataAccount(accountAfter.data);

        const writtenData = metadataAfter.data.slice(0, newData.length);
        expect(writtenData).toEqual(newData);
        expect(metadataAfter.encoding).toBe(Encoding.Utf8);
        expect(metadataAfter.compression).toBe(Compression.Gzip);
        expect(metadataAfter.format).toBe(Format.Json);
        expect(metadataAfter.dataSource).toBe(DataSource.Direct);
        expect((metadataAfter.authority as Some<Address>).value).toBe(authority);
    });
});
