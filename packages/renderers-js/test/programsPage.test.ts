import {
    accountNode,
    constantDiscriminatorNode,
    constantValueNodeFromBytes,
    fieldDiscriminatorNode,
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
    numberValueNode,
    programNode,
    sizeDiscriminatorNode,
    structFieldTypeNode,
    structTypeNode,
} from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import test from 'ava';

import { getRenderMapVisitor } from '../src/index.js';
import { renderMapContains, renderMapContainsImports } from './_setup.js';

test('it renders the program address constant', async t => {
    // Given the following program.
    const node = programNode({
        name: 'splToken',
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following program address constant.
    await renderMapContains(t, renderMap, 'programs/splToken.ts', [
        "export const SPL_TOKEN_PROGRAM_ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address<'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'>;",
    ]);

    // And we expect the following imports.
    await renderMapContainsImports(t, renderMap, 'programs/splToken.ts', {
        '@solana/web3.js': ['Address'],
    });
});

test('it renders an enum of all available accounts for a program', async t => {
    // Given the following program.
    const node = programNode({
        accounts: [accountNode({ name: 'mint' }), accountNode({ name: 'token' })],
        name: 'splToken',
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following program account enum.
    await renderMapContains(t, renderMap, 'programs/splToken.ts', ['export enum SplTokenAccount { Mint, Token }']);
});

test('it renders an function that identifies accounts in a program', async t => {
    // Given the following program with 3 accounts. Two of which have discriminators.
    const node = programNode({
        accounts: [
            // Field discriminator.
            accountNode({
                data: structTypeNode([
                    structFieldTypeNode({
                        defaultValue: numberValueNode(5),
                        name: 'key',
                        type: numberTypeNode('u8'),
                    }),
                ]),
                discriminators: [fieldDiscriminatorNode('key')],
                name: 'metadata',
            }),
            // Size and byte discriminators.
            accountNode({
                discriminators: [
                    sizeDiscriminatorNode(72),
                    constantDiscriminatorNode(constantValueNodeFromBytes('base16', '010203'), 4),
                ],
                name: 'token',
            }),
            // No discriminator.
            accountNode({ discriminators: [], name: 'mint' }),
        ],
        name: 'splToken',
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following identifier function to be rendered.
    // Notice it does not include the `mint` account because it has no discriminators.
    await renderMapContains(t, renderMap, 'programs/splToken.ts', [
        `export function identifySplTokenAccount( account: { data: Uint8Array } | Uint8Array ): SplTokenAccount { ` +
            `const data = account instanceof Uint8Array ? account : account.data; ` +
            `if ( containsBytes(data, getU8Encoder().encode(5), 0) ) { return SplTokenAccount.Metadata; } ` +
            `if ( data.length === 72 && containsBytes(data, new Uint8Array([1, 2, 3]), 4) ) { return SplTokenAccount.Token; } ` +
            `throw new Error ( 'The provided account could not be identified as a splToken account.' ); ` +
            `}`,
    ]);

    // And we expect the following imports.
    await renderMapContainsImports(t, renderMap, 'programs/splToken.ts', {
        '@solana/web3.js': ['containsBytes'],
    });
});

test('it renders an enum of all available instructions for a program', async t => {
    // Given the following program.
    const node = programNode({
        instructions: [
            instructionNode({ name: 'mintTokens' }),
            instructionNode({ name: 'transferTokens' }),
            instructionNode({ name: 'updateAuthority' }),
        ],
        name: 'splToken',
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following program instruction enum.
    await renderMapContains(t, renderMap, 'programs/splToken.ts', [
        'export enum SplTokenInstruction { MintTokens, TransferTokens, UpdateAuthority }',
    ]);
});

test('it renders an function that identifies instructions in a program', async t => {
    // Given the following program with 3 instructions. Two of which have discriminators.
    const node = programNode({
        instructions: [
            // Field discriminator.
            instructionNode({
                arguments: [
                    instructionArgumentNode({
                        defaultValue: numberValueNode(1),
                        name: 'discriminator',
                        type: numberTypeNode('u8'),
                    }),
                ],
                discriminators: [fieldDiscriminatorNode('discriminator')],
                name: 'mintTokens',
            }),
            // Size and byte discriminators.
            instructionNode({
                discriminators: [
                    sizeDiscriminatorNode(72),
                    constantDiscriminatorNode(constantValueNodeFromBytes('base16', '010203'), 4),
                ],
                name: 'transferTokens',
            }),
            // No discriminator.
            instructionNode({ discriminators: [], name: 'updateAuthority' }),
        ],
        name: 'splToken',
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following identifier function to be rendered.
    // Notice it does not include the `updateAuthority` instruction because it has no discriminators.
    await renderMapContains(t, renderMap, 'programs/splToken.ts', [
        `export function identifySplTokenInstruction ( instruction: { data: Uint8Array } | Uint8Array ): SplTokenInstruction { ` +
            `const data = instruction instanceof Uint8Array ? instruction : instruction.data; ` +
            `if ( containsBytes(data, getU8Encoder().encode(1), 0) ) { return SplTokenInstruction.MintTokens; } ` +
            `if ( data.length === 72 && containsBytes(data, new Uint8Array([1, 2, 3]), 4) ) { return SplTokenInstruction.TransferTokens; } ` +
            `throw new Error( 'The provided instruction could not be identified as a splToken instruction.' ); ` +
            `}`,
    ]);

    // And we expect the following imports.
    await renderMapContainsImports(t, renderMap, 'programs/splToken.ts', {
        '@solana/web3.js': ['containsBytes'],
    });
});

test('it checks the discriminator of sub-instructions before their parents.', async t => {
    // Given the following program with a parent instruction and a sub-instruction.
    const node = programNode({
        instructions: [
            // Parent instruction.
            instructionNode({
                arguments: [
                    instructionArgumentNode({
                        defaultValue: numberValueNode(1),
                        name: 'parentDiscriminator',
                        type: numberTypeNode('u8'),
                    }),
                    instructionArgumentNode({
                        name: 'subDiscriminator',
                        type: numberTypeNode('u32'),
                    }),
                ],
                discriminators: [fieldDiscriminatorNode('parentDiscriminator')],
                name: 'mintTokens',
                subInstructions: [
                    // Sub instruction.
                    instructionNode({
                        arguments: [
                            instructionArgumentNode({
                                defaultValue: numberValueNode(1),
                                name: 'parentDiscriminator',
                                type: numberTypeNode('u8'),
                            }),
                            instructionArgumentNode({
                                defaultValue: numberValueNode(1),
                                name: 'subDiscriminator',
                                type: numberTypeNode('u32'),
                            }),
                        ],
                        discriminators: [
                            fieldDiscriminatorNode('parentDiscriminator'),
                            fieldDiscriminatorNode('subDiscriminator', 1),
                        ],
                        name: 'mintTokensV1',
                    }),
                ],
            }),
        ],
        name: 'splToken',
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    });

    // When we render it whilst making sure we render both the parent and sub-instruction.
    const renderMap = visit(node, getRenderMapVisitor({ renderParentInstructions: true }));

    // Then we expect the sub-instruction condition to be rendered before the parent instruction condition.
    await renderMapContains(t, renderMap, 'programs/splToken.ts', [
        `if ( containsBytes(data, getU8Encoder().encode(1), 0) && containsBytes(data, getU32Encoder().encode(1), 1) ) ` +
            `{ return SplTokenInstruction.MintTokensV1; } ` +
            `if ( containsBytes(data, getU8Encoder().encode(1), 0) ) ` +
            `{ return SplTokenInstruction.MintTokens; }`,
    ]);
});

test('it renders a parsed union type of all available instructions for a program', async t => {
    // Given the following program.
    const node = programNode({
        instructions: [
            instructionNode({ name: 'mintTokens' }),
            instructionNode({ name: 'transferTokens' }),
            instructionNode({ name: 'updateAuthority' }),
        ],
        name: 'splToken',
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following program parsed instruction union type.
    await renderMapContains(t, renderMap, 'programs/splToken.ts', [
        "export type ParsedSplTokenInstruction < TProgram extends string = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' >",
        '| ({ instructionType: SplTokenInstruction.MintTokens; } & ParsedMintTokensInstruction<TProgram>)',
        '| ({ instructionType: SplTokenInstruction.TransferTokens; } & ParsedTransferTokensInstruction<TProgram>)',
        '| ({ instructionType: SplTokenInstruction.UpdateAuthority; } & ParsedUpdateAuthorityInstruction<TProgram>)',
    ]);
});
