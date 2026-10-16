import {
    findMasterEditionPda,
    findMetadataPda,
    getMetadataDecoder,
    TokenStandard,
} from '@metaplex-foundation/mpl-token-metadata-kit';
import { none, some } from '@solana/codecs';
import { beforeEach, describe, expect, test } from 'vitest';

import type { CreateInstructionDataArgs } from '../generated/mpl-token-metadata-idl-types';
import { SvmTestContext, valueTypeError } from '../test-utils';
import { createMint } from '../token/token-test-utils';
import { loadMplProgram, programClient } from './helpers';

describe('MPL Token Metadata: create', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext({ defaultPrograms: true, sysvars: true });
        loadMplProgram(ctx, programClient.programAddress);
    });

    test('should construct a valid create instruction', async () => {
        const payer = await ctx.createFundedAccount();
        const mintAuthority = await ctx.createFundedAccount();
        const mint = await ctx.createAccount();
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
            programClient.programAddress,
        ];

        const createArgs = {
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
            tokenStandard: 'fungible' as const,
            uri: 'https://example.com/metadata.json',
            uses: null,
        };
        const args: CreateInstructionDataArgs = { createArgs: { __kind: 'v1', data: createArgs } };
        const ix = await programClient.methods
            .create(args)
            .accounts({
                authority: mintAuthority,
                masterEdition: masterEditionPda,
                mint,
                payer,
                splTokenProgram: null, // omitted, so the optionalAccountStrategy gives programClient.programAddress
                // metadata: metadataPda, // auto-derived pda, can be omitted
                // updateAuthority: mintAuthority, // auto-derived into "authority" , can be omitted
            })
            .instruction();

        expect(ix.accounts?.length).toBe(9);
        expectedAccounts.forEach((expected, i) => {
            expect(expected, `Account mismatch at index ${i}`).toBe(ix.accounts?.[i].address);
        });

        await ctx.sendInstruction(ix, [payer, mintAuthority]);

        const metadataAccountInfo = ctx.requireEncodedAccount(metadataPda);
        const metadata = getMetadataDecoder().decode(metadataAccountInfo.data);

        expect(metadata.name).toBe(createArgs.name);
        expect(metadata.symbol).toBe(createArgs.symbol);
        expect(metadata.uri).toBe(createArgs.uri);
        expect(metadata.sellerFeeBasisPoints).toBe(createArgs.sellerFeeBasisPoints);
        expect(metadata.primarySaleHappened).toBe(createArgs.primarySaleHappened);
        expect(metadata.isMutable).toBe(createArgs.isMutable);
        expect(metadata.tokenStandard).toEqual(some(TokenStandard.Fungible));
        expect(metadata.collection).toEqual(none());
        expect(metadata.collectionDetails).toEqual(none());
        expect(metadata.creators).toEqual(none());
        expect(metadata.uses).toEqual(none());
    });

    test('should throw for an invalid sellerFeeBasisPoints value', async () => {
        const payer = await ctx.createFundedAccount();
        const mintAuthority = await ctx.createFundedAccount();
        const mint = await ctx.createAccount();
        await createMint(ctx, payer, mint, mintAuthority);
        const [masterEditionPda] = await findMasterEditionPda({ mint });

        const createArgs = {
            collection: null,
            collectionDetails: null,
            creators: null,
            decimals: null,
            isMutable: true,
            name: 'Test NFT',
            primarySaleHappened: false,
            printSupply: null,
            ruleSet: null,
            sellerFeeBasisPoints: 'not a number' as unknown as number, // invalid value for amountValueNode
            symbol: 'TST',
            tokenStandard: 'fungible' as const,
            uri: 'https://example.com/metadata.json',
            uses: null,
        };
        const args: CreateInstructionDataArgs = { createArgs: { __kind: 'v1', data: createArgs } };

        await expect(
            programClient.methods
                .create(args)
                .accounts({
                    authority: mintAuthority,
                    masterEdition: masterEditionPda,
                    mint,
                    payer,
                    splTokenProgram: null,
                })
                .instruction(),
        ).rejects.toThrow(
            valueTypeError(
                { identifier: 'sellerFeeBasisPoints', kind: 'structFieldTypeNode' },
                { actualType: 'string', nodeKind: 'integerTypeNode' },
            ),
        );
    });

    test('should construct a create instruction with mint as signer and provided TokenProgram', async () => {
        const payer = await ctx.createFundedAccount();
        const mintAuthority = await ctx.createFundedAccount();
        const mint = await ctx.createAccount();
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
            ctx.TOKEN_PROGRAM_ADDRESS,
        ];

        const createArgs = {
            collection: null,
            collectionDetails: null,
            creators: null,
            decimals: null,
            isMutable: true,
            name: 'Test NFT',
            primarySaleHappened: false,
            printSupply: null,
            ruleSet: null,
            sellerFeeBasisPoints: 500n,
            symbol: 'TST',
            tokenStandard: 'fungible' as const,
            uri: 'https://example.com/metadata.json',
            uses: null,
        };
        const args: CreateInstructionDataArgs = { createArgs: { __kind: 'v1', data: createArgs } };

        const ix = await programClient.methods
            .create(args)
            .accounts({
                authority: mintAuthority,
                masterEdition: masterEditionPda,
                mint,
                payer,
                splTokenProgram: ctx.TOKEN_PROGRAM_ADDRESS,
            })
            .signers(['mint'])
            .instruction();

        expect(ix.accounts?.length).toBe(9);
        expectedAccounts.forEach((expected, i) => {
            expect(expected, `Account mismatch at index ${i}`).toBe(ix.accounts?.[i].address);
        });

        await ctx.sendInstruction(ix, [payer, mintAuthority, mint]);

        const metadataAccountInfo = ctx.requireEncodedAccount(metadataPda);
        const metadata = getMetadataDecoder().decode(metadataAccountInfo.data);

        expect(metadata.name).toBe(createArgs.name);
        expect(metadata.symbol).toBe(createArgs.symbol);
        expect(metadata.uri).toBe(createArgs.uri);
        expect(metadata.sellerFeeBasisPoints).toBe(Number(createArgs.sellerFeeBasisPoints));
        expect(metadata.primarySaleHappened).toBe(createArgs.primarySaleHappened);
        expect(metadata.isMutable).toBe(createArgs.isMutable);
        expect(metadata.tokenStandard).toEqual(some(TokenStandard.Fungible));
        expect(metadata.collection).toEqual(none());
        expect(metadata.collectionDetails).toEqual(none());
        expect(metadata.creators).toEqual(none());
        expect(metadata.uses).toEqual(none());
    });
});
