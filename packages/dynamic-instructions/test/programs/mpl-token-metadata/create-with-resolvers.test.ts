import {
    findMasterEditionPda,
    findMetadataPda,
    getMetadataDecoder,
    TokenStandard,
} from '@metaplex-foundation/mpl-token-metadata-kit';
import { address } from '@solana/addresses';
import { some } from '@solana/codecs';
import { beforeEach, describe, expect, test } from 'vitest';

import type { CreateArgs } from '../generated/mpl-token-metadata-idl-types';
import { SvmTestContext } from '../test-utils';
import { createMint } from '../token/token-test-utils';
import { loadMplProgram, programClient } from './helpers';

function buildFungibleArgs(): CreateArgs {
    return {
        createArgs: {
            __kind: 'v1',
            collection: null,
            collectionDetails: null,
            creators: null,
            decimals: null,
            isMutable: true,
            name: 'Test NFT',
            primarySaleHappened: false,
            printSupply: null,
            ruleSet: null,
            sellerFeeBasisPoints: 500,
            symbol: 'TST',
            tokenStandard: 'fungible',
            uri: 'https://example.com/metadata.json',
            uses: null,
        },
    };
}

describe('MPL Token Metadata: create with resolvers', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext({ defaultPrograms: true, sysvars: true });
        loadMplProgram(ctx, programClient.programAddress);
    });

    test('should auto-resolve splTokenProgram when resolveIsNonFungibleOrIsMintSigner returns true', async () => {
        const payer = ctx.createFundedAccount();
        const mintAuthority = ctx.createFundedAccount();
        const mint = ctx.createAccount();
        await createMint(ctx, payer, mint, mintAuthority);

        const [metadataPda] = await findMetadataPda({ mint });
        const [masterEditionPda] = await findMasterEditionPda({ mint });

        const expectedAccounts = [
            metadataPda,
            masterEditionPda,
            mint,
            mintAuthority,
            payer,
            mintAuthority,
            ctx.SYSTEM_PROGRAM_ADDRESS,
            ctx.SYSVAR_INSTRUCTIONS_ADDRESS,
            address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // from ifTrue branch
        ];

        const ix = await programClient.methods
            .create(buildFungibleArgs())
            .accounts({
                authority: mintAuthority,
                masterEdition: masterEditionPda,
                mint,
                payer,
                // splTokenProgram omitted — should be auto-resolved via defaultValue resolver
            })
            .signers(['mint'])
            .resolvers({
                // conditionalValueNode -> resolveIsNonFungibleOrIsMintSigner -> ifTrue branch -> publicKeyValueNode
                resolveIsNonFungibleOrIsMintSigner: async () => await Promise.resolve(true),
            })
            .instruction();

        expect(ix.accounts?.length).toBe(9);
        expectedAccounts.forEach((expected, i) => {
            expect(expected, `Account mismatch at index ${i}`).toBe(ix.accounts?.[i].address);
        });

        ctx.sendInstruction(ix, [payer, mintAuthority, mint]);

        const metadataAccountInfo = ctx.requireEncodedAccount(metadataPda);
        const metadata = getMetadataDecoder().decode(metadataAccountInfo.data);
        expect(metadata.tokenStandard).toEqual(some(TokenStandard.Fungible));
    });

    test('should resolve splTokenProgram to programId when resolver returns false (optionalAccountStrategy=programId)', async () => {
        const payer = ctx.createFundedAccount();
        const mintAuthority = ctx.createFundedAccount();
        const mint = ctx.createAccount();
        await createMint(ctx, payer, mint, mintAuthority);

        const [masterEditionPda] = await findMasterEditionPda({ mint });

        const ix = await programClient.methods
            .create(buildFungibleArgs())
            .accounts({
                authority: mintAuthority,
                masterEdition: masterEditionPda,
                mint,
                payer,
            })
            .signers(['mint'])
            .resolvers({
                resolveIsNonFungibleOrIsMintSigner: async () => await Promise.resolve(false),
            })
            .instruction();

        // resolver returns false -> ifFalse is undefined -> conditional returns null
        // optional optionalAccountStrategy=programId resolves to program ID
        expect(ix.accounts?.length).toBe(9);
        expect(ix.accounts?.[ix.accounts.length - 1].address).toBe(programClient.programAddress);

        ctx.sendInstruction(ix, [payer, mintAuthority, mint]);
        const [metadataPda] = await findMetadataPda({ mint });
        const metadataAccountInfo = ctx.requireEncodedAccount(metadataPda);
        const metadata = getMetadataDecoder().decode(metadataAccountInfo.data);
        expect(metadata.tokenStandard).toEqual(some(TokenStandard.Fungible));
    });

    test('should use user-provided account and bypass resolver', async () => {
        const payer = ctx.createFundedAccount();
        const splTokenProgramMock = ctx.createAccount();
        const mintAuthority = ctx.createFundedAccount();
        const mint = ctx.createAccount();
        await createMint(ctx, payer, mint, mintAuthority);

        const [masterEditionPda] = await findMasterEditionPda({ mint });

        const ix = await programClient.methods
            .create(buildFungibleArgs())
            .accounts({
                authority: mintAuthority,
                masterEdition: masterEditionPda,
                mint,
                payer,
                splTokenProgram: splTokenProgramMock,
            })
            .signers(['mint'])
            .resolvers({
                // This resolver should not be called since splTokenProgram is explicitly provided
                resolveIsNonFungibleOrIsMintSigner: async () => {
                    return await Promise.reject(
                        new Error('Resolver should not be called for explicitly provided account'),
                    );
                },
            })
            .instruction();

        expect(ix.accounts?.[ix.accounts.length - 1].address).toBe(splTokenProgramMock);

        ctx.sendInstruction(ix, [payer, mintAuthority, mint]);
        const [metadataPda] = await findMetadataPda({ mint });
        const metadataAccountInfo = ctx.requireEncodedAccount(metadataPda);
        const metadata = getMetadataDecoder().decode(metadataAccountInfo.data);
        expect(metadata.tokenStandard).toEqual(some(TokenStandard.Fungible));
    });

    test('should work without calling .resolvers()', async () => {
        const payer = ctx.createFundedAccount();
        const mintAuthority = ctx.createFundedAccount();
        const mint = ctx.createAccount();
        await createMint(ctx, payer, mint, mintAuthority);

        const [masterEditionPda] = await findMasterEditionPda({ mint });

        const ix = await programClient.methods
            .create(buildFungibleArgs())
            .accounts({
                authority: mintAuthority,
                masterEdition: masterEditionPda,
                mint,
                payer,
                splTokenProgram: null, // auto resolution via optionalAccountStrategy into programId
            })
            .signers(['mint'])
            .instruction();

        expect(ix.programAddress).toBe(programClient.programAddress);
        expect(ix.accounts?.length).toBe(9);
        expect(ix.accounts?.[ix.accounts.length - 1].address).toBe(programClient.programAddress);

        ctx.sendInstruction(ix, [payer, mintAuthority, mint]);
        const [metadataPda] = await findMetadataPda({ mint });
        const metadataAccountInfo = ctx.requireEncodedAccount(metadataPda);
        const metadata = getMetadataDecoder().decode(metadataAccountInfo.data);
        expect(metadata.tokenStandard).toEqual(some(TokenStandard.Fungible));
    });

    test('should fallback to optionalAccountStrategy when no resolver and no account provided', async () => {
        const payer = ctx.createFundedAccount();
        const mintAuthority = ctx.createFundedAccount();
        const mint = ctx.createAccount();
        await createMint(ctx, payer, mint, mintAuthority);

        const [masterEditionPda] = await findMasterEditionPda({ mint });

        // undefined splTokenProgram triggers defaultValue auto-resolution.
        // defaultValue is conditionalValueNode with undefined ifFalse branch
        // Without resolvers provided, condition should choose ifFalse branch
        // Optional account should be resolved into programId via optionalAccountStrategy
        const ix = await programClient.methods
            .create(buildFungibleArgs())
            .accounts({
                authority: mintAuthority,
                masterEdition: masterEditionPda,
                mint,
                payer,
            })
            .signers(['mint'])
            .instruction();

        expect(ix.accounts?.length).toBe(9);
        expect(ix.accounts?.[ix.accounts.length - 1].address).toBe(programClient.programAddress);

        ctx.sendInstruction(ix, [payer, mintAuthority, mint]);
        const [metadataPda] = await findMetadataPda({ mint });
        const metadataAccountInfo = ctx.requireEncodedAccount(metadataPda);
        const metadata = getMetadataDecoder().decode(metadataAccountInfo.data);
        expect(metadata.tokenStandard).toEqual(some(TokenStandard.Fungible));
    });
});
