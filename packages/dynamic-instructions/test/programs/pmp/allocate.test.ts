import { type Address } from '@solana/addresses';
import type { Some } from '@solana/codecs';
import { AccountDiscriminator } from '@solana-program/program-metadata';
import { beforeEach, describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { decodeBufferAccount, loadPmpProgram, programClient, setupCanonicalPda, setupNonCanonicalPda } from './helpers';

describe('Program Metadata: allocate', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext();
        loadPmpProgram(ctx, programClient.programAddress);
    });

    test('should allocate with seed null', async () => {
        const bufferAndAuthority = ctx.createFundedAccount();

        const ix = await programClient.methods
            .allocate({ seed: null })
            .accounts({
                authority: bufferAndAuthority,
                buffer: bufferAndAuthority,
                program: null,
                programData: null,
            })
            .instruction();

        ctx.sendInstruction(ix, [bufferAndAuthority]);

        const account = ctx.requireEncodedAccount(bufferAndAuthority);

        const buffer = decodeBufferAccount(account.data);
        expect(buffer.discriminator).toBe(AccountDiscriminator.Buffer);
        expect(buffer.canonical).toBe(false);
        expect(buffer.program).toEqual({ __option: 'None' });
        expect((buffer.authority as Some<Address>).value).toBe(bufferAndAuthority);
    });

    test('should allocate canonical PDA buffer', async () => {
        const seed = 'idl';
        const { authority, programAddress, programDataAddress, pda: bufferPda } = await setupCanonicalPda(ctx, seed);

        const ix = await programClient.methods
            .allocate({ seed })
            .accounts({
                authority,
                buffer: bufferPda,
                program: programAddress,
                programData: programDataAddress,
            })
            .instruction();

        ctx.sendInstruction(ix, [authority]);

        const account = ctx.requireEncodedAccount(bufferPda);
        expect(account.owner).toBe(programClient.programAddress);
        expect(account.data.length).gt(0);

        const buffer = decodeBufferAccount(account.data);
        expect(buffer.discriminator).toBe(AccountDiscriminator.Buffer);
        expect(buffer.canonical).toBe(true);
        expect(buffer.program).toEqual({ __option: 'Some', value: programAddress });
        expect(buffer.authority).toEqual({ __option: 'Some', value: authority });
        expect(buffer.seed).toBe(seed);
    });

    test('should allocate non-canonical PDA buffer', async () => {
        const seed = 'idl';
        const { authority, programAddress, programDataAddress, pda: bufferPda } = await setupNonCanonicalPda(ctx, seed);

        const ix = await programClient.methods
            .allocate({ seed })
            .accounts({
                authority,
                buffer: bufferPda,
                program: programAddress,
                programData: programDataAddress,
            })
            .instruction();

        ctx.sendInstruction(ix, [authority]);

        const account = ctx.requireEncodedAccount(bufferPda);
        expect(account.owner).toBe(programClient.programAddress);
        expect(account.data.length).gt(0);

        const buffer = decodeBufferAccount(account.data);
        expect(buffer.discriminator).toBe(AccountDiscriminator.Buffer);
        expect(buffer.canonical).toBe(false);
        expect(buffer.program).toEqual({ __option: 'Some', value: programAddress });
        expect(buffer.authority).toEqual({ __option: 'Some', value: authority });
        expect(buffer.seed).toBe(seed);
    });
});
