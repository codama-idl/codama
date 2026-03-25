import {
    findMasterEditionPda,
    findMetadataPda,
    getMetadataDecoder,
    TokenStandard,
} from '@metaplex-foundation/mpl-token-metadata-kit';
import { none, some } from '@solana/codecs';
import { beforeEach, describe, expect, test } from 'vitest';

import type { CreateArgs } from '../generated/mpl-token-metadata-idl-types';
import { SvmTestContext } from '../test-utils';
import { createMint } from '../token/token-test-utils';
import { loadMplProgram, programClient } from './helpers';

describe('MPL Token Metadata: create', () => {
    let ctx: SvmTestContext;

    beforeEach(() => {
        ctx = new SvmTestContext({ defaultPrograms: true, sysvars: true });
        loadMplProgram(ctx, programClient.programAddress);
    });

    test('should construct a valid create instruction', async () => {
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
            programClient.programAddress,
        ];

        const args: CreateArgs = {
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
        const ix = await programClient.methods
            .create(args)
            .accounts({
                authority: mintAuthority,
                masterEdition: masterEditionPda,
                mint,
                payer,
                splTokenProgram: null, // auto-derived via optionalAccountStrategy into programClient.programAddress
                // metadata: metadataPda, // auto-derived pda, can be omitted
                // updateAuthority: mintAuthority, // auto-derived into "authority" , can be omitted
            })
            .instruction();

        expect(ix.accounts?.length).toBe(9);
        expectedAccounts.forEach((expected, i) => {
            expect(expected, `Account mismatch at index ${i}`).toBe(ix.accounts?.[i].address);
        });

        ctx.sendInstruction(ix, [payer, mintAuthority]);

        const metadataAccountInfo = ctx.requireEncodedAccount(metadataPda);
        const metadata = getMetadataDecoder().decode(metadataAccountInfo.data);

        expect(metadata.name).toBe(args.createArgs.name);
        expect(metadata.symbol).toBe(args.createArgs.symbol);
        expect(metadata.uri).toBe(args.createArgs.uri);
        expect(metadata.sellerFeeBasisPoints).toBe(args.createArgs.sellerFeeBasisPoints);
        expect(metadata.primarySaleHappened).toBe(args.createArgs.primarySaleHappened);
        expect(metadata.isMutable).toBe(args.createArgs.isMutable);
        expect(metadata.tokenStandard).toEqual(some(TokenStandard.Fungible));
        expect(metadata.collection).toEqual(none());
        expect(metadata.collectionDetails).toEqual(none());
        expect(metadata.creators).toEqual(none());
        expect(metadata.uses).toEqual(none());
    });

    test('should throw ValidationError for invalid sellerFeeBasisPoints [amountValueNode]', async () => {
        const payer = ctx.createFundedAccount();
        const mintAuthority = ctx.createFundedAccount();
        const mint = ctx.createAccount();
        await createMint(ctx, payer, mint, mintAuthority);
        const [masterEditionPda] = await findMasterEditionPda({ mint });

        const args: CreateArgs = {
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
                sellerFeeBasisPoints: 'not a number' as unknown as number, // invalid value for amountValueNode
                symbol: 'TST',
                tokenStandard: 'fungible',
                uri: 'https://example.com/metadata.json',
                uses: null,
            },
        };

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
        ).rejects.toThrowError(/Invalid argument "createArgs"/);
    });

    test('should construct a create instruction with mint as signer and provided TokenProgram', async () => {
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
            ctx.TOKEN_PROGRAM_ADDRESS,
        ];

        const args: CreateArgs = {
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
                sellerFeeBasisPoints: 500n,
                symbol: 'TST',
                tokenStandard: 'fungible',
                uri: 'https://example.com/metadata.json',
                uses: null,
            },
        };

        const ix = await programClient.methods
            .create(args)
            .accounts({
                authority: mintAuthority,
                masterEdition: masterEditionPda,
                mint,
                payer,
                splTokenProgram: ctx.TOKEN_PROGRAM_ADDRESS, // explicitly provide to skip auto-derivation with ResolverValueNode which is not supported yet
            })
            .signers(['mint'])
            .instruction();

        expect(ix.accounts?.length).toBe(9);
        expectedAccounts.forEach((expected, i) => {
            expect(expected, `Account mismatch at index ${i}`).toBe(ix.accounts?.[i].address);
        });

        ctx.sendInstruction(ix, [payer, mintAuthority, mint]);

        const metadataAccountInfo = ctx.requireEncodedAccount(metadataPda);
        const metadata = getMetadataDecoder().decode(metadataAccountInfo.data);

        expect(metadata.name).toBe(args.createArgs.name);
        expect(metadata.symbol).toBe(args.createArgs.symbol);
        expect(metadata.uri).toBe(args.createArgs.uri);
        expect(metadata.sellerFeeBasisPoints).toBe(Number(args.createArgs.sellerFeeBasisPoints));
        expect(metadata.primarySaleHappened).toBe(args.createArgs.primarySaleHappened);
        expect(metadata.isMutable).toBe(args.createArgs.isMutable);
        expect(metadata.tokenStandard).toEqual(some(TokenStandard.Fungible));
        expect(metadata.collection).toEqual(none());
        expect(metadata.collectionDetails).toEqual(none());
        expect(metadata.creators).toEqual(none());
        expect(metadata.uses).toEqual(none());
    });
});
