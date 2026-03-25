import { beforeEach, describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import {
    deriveCanonicalPda,
    deriveNonCanonicalPda,
    loadPmpProgram,
    programClient,
    setupCanonicalPda,
    setupNonCanonicalPda,
} from './helpers';

describe('Program Metadata: pdas', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
        loadPmpProgram(ctx, programClient.programAddress);
    });

    describe('canonical', () => {
        test('should derive canonical PDA matching manual derivation', async () => {
            const programAddress = ctx.createAccount();
            const seed = 'idl';

            const [pdaFromHelper] = await programClient.pdas.canonical({ program: programAddress, seed });
            const manualPda = await deriveCanonicalPda(programAddress, seed);

            expect(pdaFromHelper).toBe(manualPda);
        });

        test('should derive different PDAs for different seeds', async () => {
            const programAddress = ctx.createAccount();

            const [pda1] = await programClient.pdas.canonical({ program: programAddress, seed: 'idl' });
            const [pda2] = await programClient.pdas.canonical({ program: programAddress, seed: 'config' });

            expect(pda1).not.toBe(pda2);
        });

        test('should derive different PDAs for different programs', async () => {
            const program1 = ctx.createAccount();
            const program2 = ctx.createAccount();

            const [pda1] = await programClient.pdas.canonical({ program: program1, seed: 'idl' });
            const [pda2] = await programClient.pdas.canonical({ program: program2, seed: 'idl' });

            expect(pda1).not.toBe(pda2);
        });

        test('should match instruction-resolved metadata PDA', async () => {
            const seed = 'idl';
            const { authority, programAddress, programDataAddress } = await setupCanonicalPda(ctx, seed);

            const ix = await programClient.methods
                .initialize({
                    compression: 'none',
                    data: new TextEncoder().encode('test'),
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

            const [pdaFromHelper] = await programClient.pdas.canonical({ program: programAddress, seed });
            // The instruction's 1st account (index 0) is the metadata PDA
            const pdaFromIx = ix.accounts?.[0]?.address;

            expect(pdaFromHelper).toBe(pdaFromIx);
        });
    });

    describe('nonCanonical', () => {
        test('should derive non-canonical PDA matching manual derivation', async () => {
            const programAddress = ctx.createAccount();
            const authority = ctx.createAccount();
            const seed = 'idl';

            const [pdaFromHelper] = await programClient.pdas.nonCanonical({ authority, program: programAddress, seed });
            const manualPda = await deriveNonCanonicalPda(programAddress, authority, seed);

            expect(pdaFromHelper).toBe(manualPda);
        });

        test('should derive different PDAs for different authorities', async () => {
            const programAddress = ctx.createAccount();
            const authority1 = ctx.createAccount();
            const authority2 = ctx.createAccount();

            const [pda1] = await programClient.pdas.nonCanonical({
                authority: authority1,
                program: programAddress,
                seed: 'idl',
            });
            const [pda2] = await programClient.pdas.nonCanonical({
                authority: authority2,
                program: programAddress,
                seed: 'idl',
            });

            expect(pda1).not.toBe(pda2);
        });

        test('should match instruction-resolved metadata PDA', async () => {
            const seed = 'idl';
            const { authority, programAddress } = await setupNonCanonicalPda(ctx, seed);

            const ix = await programClient.methods
                .initialize({
                    compression: 'none',
                    data: new TextEncoder().encode('test'),
                    dataSource: 'direct',
                    encoding: 'utf8',
                    format: 'json',
                    seed,
                })
                .accounts({
                    authority,
                    program: programAddress,
                    programData: null,
                })
                .instruction();

            const [pdaFromHelper] = await programClient.pdas.nonCanonical({ authority, program: programAddress, seed });
            const pdaFromIx = ix.accounts?.[0]?.address;

            expect(pdaFromHelper).toBe(pdaFromIx);
        });
    });

    describe('metadata', () => {
        test('should derive canonical PDA when authority is null', async () => {
            const programAddress = ctx.createAccount();
            const seed = 'idl';

            const [metadataPda] = await programClient.pdas.metadata({ authority: null, program: programAddress, seed });
            const [canonicalPda] = await programClient.pdas.canonical({ program: programAddress, seed });

            expect(metadataPda).toBe(canonicalPda);
        });

        test('should derive non-canonical PDA when authority is provided', async () => {
            const programAddress = ctx.createAccount();
            const authority = ctx.createAccount();
            const seed = 'idl';

            const [metadataPda] = await programClient.pdas.metadata({ authority, program: programAddress, seed });
            const [nonCanonicalPda] = await programClient.pdas.nonCanonical({
                authority,
                program: programAddress,
                seed,
            });

            expect(metadataPda).toBe(nonCanonicalPda);
        });
    });
});
