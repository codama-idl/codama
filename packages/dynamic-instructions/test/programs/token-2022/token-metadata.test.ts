import type { Address } from '@solana/addresses';
import { some } from '@solana/codecs';
import { type Extension, getMintDecoder, getMintSize } from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../test-utils';
import { systemClient, token2022Client } from './token-2022-test-utils';

// Create a mint with MetadataPointer + TokenMetadata extensions
async function createMintWithMetadata(
    ctx: SvmTestContext,
    payer: Address,
    updateAuthority: Address,
    metadata: { name: string; symbol: string; uri: string },
) {
    const mint = ctx.createAccount();

    // Allocate only MetadataPointer space
    // initializeTokenMetadata will realloc the account internally to fit the metadata.
    // Fund with enough lamports for the full size (pointer + metadata) so realloc succeeds.
    const pointerSize = getMintSize([{ __kind: 'MetadataPointer', authority: updateAuthority, metadataAddress: mint }]);
    const fullSize = getMintSize([
        { __kind: 'MetadataPointer', authority: updateAuthority, metadataAddress: mint },
        {
            __kind: 'TokenMetadata',
            additionalMetadata: new Map(),
            mint,
            name: metadata.name,
            symbol: metadata.symbol,
            updateAuthority,
            uri: metadata.uri,
        },
    ]);
    // Add extra space for potential field updates (updateTokenMetadataField reallocs the account)
    const lamports = ctx.getMinimumBalanceForRentExemption(BigInt(fullSize * 2));

    const createAccountIx = await systemClient.methods
        .createAccount({ lamports, programAddress: ctx.TOKEN_2022_PROGRAM_ADDRESS, space: pointerSize })
        .accounts({ newAccount: mint, payer })
        .instruction();

    const initMetadataPointerIx = await token2022Client.methods
        .initializeMetadataPointer({ authority: updateAuthority, metadataAddress: mint })
        .accounts({ mint })
        .instruction();

    const initMintIx = await token2022Client.methods
        .initializeMint2({ decimals: 9, mintAuthority: payer })
        .accounts({ mint })
        .instruction();

    const initTokenMetadataIx = await token2022Client.methods
        .initializeTokenMetadata({ name: metadata.name, symbol: metadata.symbol, uri: metadata.uri })
        .accounts({ metadata: mint, mint, mintAuthority: payer, updateAuthority })
        .instruction();

    ctx.sendInstructions([createAccountIx, initMetadataPointerIx, initMintIx, initTokenMetadataIx], [payer, mint]);

    return mint;
}

describe('Token 2022 Program: tokenMetadata', () => {
    test('should initialize token metadata [initializeTokenMetadata]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const updateAuthority = ctx.createFundedAccount();

        const mint = await createMintWithMetadata(ctx, payer, updateAuthority, {
            name: 'Test Token',
            symbol: 'TST',
            uri: 'https://example.com/metadata.json',
        });

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.extensions).toMatchObject(
            some([
                { __kind: 'MetadataPointer', authority: some(updateAuthority), metadataAddress: some(mint) },
                {
                    __kind: 'TokenMetadata',
                    name: 'Test Token',
                    symbol: 'TST',
                    updateAuthority: { __option: 'Some', value: updateAuthority },
                    uri: 'https://example.com/metadata.json',
                },
            ]),
        );
    });

    test('should update token metadata field [updateTokenMetadataField]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const updateAuthority = ctx.createFundedAccount();

        const mint = await createMintWithMetadata(ctx, payer, updateAuthority, {
            name: 'Test Token',
            symbol: 'TST',
            uri: 'https://example.com/metadata.json',
        });

        const updateNameIx = await token2022Client.methods
            .updateTokenMetadataField({ field: { __kind: 'name' }, value: 'Updated Token' })
            .accounts({ metadata: mint, updateAuthority })
            .instruction();
        const updateSymbolIx = await token2022Client.methods
            .updateTokenMetadataField({ field: { __kind: 'symbol' }, value: 'LOL' })
            .accounts({ metadata: mint, updateAuthority })
            .instruction();
        const addKeyIx = await token2022Client.methods
            .updateTokenMetadataField({ field: { __kind: 'key', fields: ['color'] }, value: 'blue' })
            .accounts({ metadata: mint, updateAuthority })
            .instruction();

        ctx.sendInstructions([updateNameIx, updateSymbolIx, addKeyIx], [payer, updateAuthority]);

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.extensions).toEqual(
            some<Extension[]>([
                { __kind: 'MetadataPointer', authority: some(updateAuthority), metadataAddress: some(mint) },
                {
                    __kind: 'TokenMetadata',
                    additionalMetadata: new Map([['color', 'blue']]),
                    mint,
                    name: 'Updated Token',
                    symbol: 'LOL',
                    updateAuthority: some(updateAuthority),
                    uri: 'https://example.com/metadata.json',
                },
            ]),
        );
    });

    test('should add and remove custom metadata key [updateTokenMetadataField + removeTokenMetadataKey]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const updateAuthority = ctx.createFundedAccount();

        // Use shorter metadata so there's room for additionalMetadata in the allocated space
        const mint = await createMintWithMetadata(ctx, payer, updateAuthority, {
            name: 'T',
            symbol: 'T',
            uri: '',
        });

        // Add a custom key-value pair
        const addKeyIx = await token2022Client.methods
            .updateTokenMetadataField({ field: { __kind: 'key', fields: ['color'] }, value: 'blue' })
            .accounts({ metadata: mint, updateAuthority })
            .instruction();
        ctx.sendInstruction(addKeyIx, [payer, updateAuthority]);

        let mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.extensions).toEqual(
            some<Extension[]>([
                { __kind: 'MetadataPointer', authority: some(updateAuthority), metadataAddress: some(mint) },
                {
                    __kind: 'TokenMetadata',
                    additionalMetadata: new Map([['color', 'blue']]),
                    mint,
                    name: 'T',
                    symbol: 'T',
                    updateAuthority: some(updateAuthority),
                    uri: '',
                },
            ]),
        );

        // Remove the custom key
        const removeKeyIx = await token2022Client.methods
            .removeTokenMetadataKey({ idempotent: false, key: 'color' })
            .accounts({ metadata: mint, updateAuthority })
            .instruction();
        ctx.sendInstruction(removeKeyIx, [payer, updateAuthority]);

        mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.extensions).toEqual(
            some<Extension[]>([
                { __kind: 'MetadataPointer', authority: some(updateAuthority), metadataAddress: some(mint) },
                {
                    __kind: 'TokenMetadata',
                    additionalMetadata: new Map(),
                    mint,
                    name: 'T',
                    symbol: 'T',
                    updateAuthority: some(updateAuthority),
                    uri: '',
                },
            ]),
        );
    });

    test('should update token metadata update authority [updateTokenMetadataUpdateAuthority]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const updateAuthority = ctx.createFundedAccount();
        const newUpdateAuthority = ctx.createFundedAccount();

        const mint = await createMintWithMetadata(ctx, payer, updateAuthority, {
            name: 'Test Token',
            symbol: 'TST',
            uri: 'https://example.com/metadata.json',
        });

        const updateAuthorityIx = await token2022Client.methods
            .updateTokenMetadataUpdateAuthority({ newUpdateAuthority })
            .accounts({ metadata: mint, updateAuthority })
            .instruction();
        ctx.sendInstruction(updateAuthorityIx, [payer, updateAuthority]);

        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.extensions).toMatchObject(
            some([
                { __kind: 'MetadataPointer' },
                {
                    __kind: 'TokenMetadata',
                    updateAuthority: { __option: 'Some', value: newUpdateAuthority },
                },
            ]),
        );
    });

    test('should emit token metadata [emitTokenMetadata]', async () => {
        const ctx = new SvmTestContext({ defaultPrograms: true });
        const payer = ctx.createFundedAccount();
        const updateAuthority = ctx.createFundedAccount();

        const mint = await createMintWithMetadata(ctx, payer, updateAuthority, {
            name: 'Test Token',
            symbol: 'TST',
            uri: 'https://example.com/metadata.json',
        });

        // emitTokenMetadata emits serialized TokenMetadata as return data
        // We just ensure that tx was not failed
        const emitIx = await token2022Client.methods.emitTokenMetadata().accounts({ metadata: mint }).instruction();
        const result = ctx.sendInstruction(emitIx, [payer]);
        expect(result.returnData().data()).toBeDefined();

        // And verify metadata is unchanged after emit
        const mintData = getMintDecoder().decode(ctx.requireEncodedAccount(mint).data);
        expect(mintData.extensions).toMatchObject(
            some([{ __kind: 'MetadataPointer' }, { __kind: 'TokenMetadata', name: 'Test Token', symbol: 'TST' }]),
        );
    });
});
