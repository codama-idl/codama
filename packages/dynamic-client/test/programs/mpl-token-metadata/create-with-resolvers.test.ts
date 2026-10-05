import { CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING } from '@codama/errors';
import {
    findMasterEditionPda,
    findMetadataPda,
    getMetadataDecoder,
    TokenStandard,
} from '@metaplex-foundation/mpl-token-metadata-kit';
import type { Address } from '@solana/addresses';
import { some } from '@solana/codecs';
import { pluginNode } from 'codama';
import { beforeEach, describe, expect, test } from 'vitest';

import type { CreateInstructionDataArgs } from '../generated/mpl-token-metadata-idl-types';
import { SvmTestContext } from '../test-utils';
import { createMint } from '../token/token-test-utils';
import { loadMplProgram, programClient } from './helpers';

function buildFungibleArgs(): CreateInstructionDataArgs {
    return {
        createArgs: {
            __kind: 'v1',
            data: {
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
        },
    };
}

/**
 * In v1, `splTokenProgram` defaulted to a conditional value whose condition was
 * a custom resolver. Once upgraded, it has no default value and carries a
 * `codama.resolver` plugin instead, so callers provide it explicitly.
 */
describe('MPL Token Metadata: create with a resolved account', () => {
    let ctx: SvmTestContext;
    let payer: Address;
    let mintAuthority: Address;
    let mint: Address;
    let masterEditionPda: Address;

    beforeEach(async () => {
        ctx = new SvmTestContext({ defaultPrograms: true, sysvars: true });
        loadMplProgram(ctx, programClient.programAddress);
        payer = await ctx.createFundedAccount();
        mintAuthority = await ctx.createFundedAccount();
        mint = await ctx.createAccount();
        await createMint(ctx, payer, mint, mintAuthority);
        [masterEditionPda] = await findMasterEditionPda({ mint });
    });

    async function expectFungibleMetadata(): Promise<void> {
        const [metadataPda] = await findMetadataPda({ mint });
        const metadata = getMetadataDecoder().decode(ctx.requireEncodedAccount(metadataPda).data);
        expect(metadata.tokenStandard).toEqual(some(TokenStandard.Fungible));
    }

    test('should keep the resolver of splTokenProgram as a codama.resolver plugin', () => {
        const instruction = programClient.instructions.get('create');
        const splTokenProgram = instruction?.accounts?.find(account => account.identifier === 'splTokenProgram');
        expect(splTokenProgram?.defaultValue).toBeUndefined();
        expect(splTokenProgram?.plugins).toStrictEqual([
            pluginNode('codama.resolver', {
                dependsOn: ['accounts.mint', 'data.tokenStandard'],
                name: 'resolveCreateSplTokenProgram',
            }),
        ]);
    });

    test('should use the provided splTokenProgram', async () => {
        const [metadataPda] = await findMetadataPda({ mint });

        const ix = await programClient.methods
            .create(buildFungibleArgs())
            .accounts({
                authority: mintAuthority,
                masterEdition: masterEditionPda,
                mint,
                payer,
                splTokenProgram: ctx.TOKEN_PROGRAM_ADDRESS,
            })
            .signers(['mint'])
            .instruction();

        expect(ix.accounts?.map(account => account.address)).toStrictEqual([
            metadataPda,
            masterEditionPda,
            mint,
            mintAuthority,
            payer,
            mintAuthority,
            ctx.SYSTEM_PROGRAM_ADDRESS,
            ctx.SYSVAR_INSTRUCTIONS_ADDRESS,
            ctx.TOKEN_PROGRAM_ADDRESS,
        ]);

        await ctx.sendInstruction(ix, [payer, mintAuthority, mint]);
        await expectFungibleMetadata();
    });

    test('should apply the optionalAccountStrategy when splTokenProgram is null', async () => {
        const ix = await programClient.methods
            .create(buildFungibleArgs())
            .accounts({
                authority: mintAuthority,
                masterEdition: masterEditionPda,
                mint,
                payer,
                splTokenProgram: null,
            })
            .signers(['mint'])
            .instruction();

        expect(ix.accounts?.length).toBe(9);
        expect(ix.accounts?.[8].address).toBe(programClient.programAddress);

        await ctx.sendInstruction(ix, [payer, mintAuthority, mint]);
        await expectFungibleMetadata();
    });

    test('should require splTokenProgram to be provided', async () => {
        await expect(
            programClient.methods
                .create(buildFungibleArgs())
                // @ts-expect-error - testing a missing resolved account
                .accounts({ authority: mintAuthority, masterEdition: masterEditionPda, mint, payer })
                .signers(['mint'])
                .instruction(),
        ).rejects.toThrow(
            expect.objectContaining({
                context: expect.objectContaining({
                    __code: CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING,
                    accountName: 'splTokenProgram',
                    instructionName: 'create',
                }),
            }),
        );
    });
});
