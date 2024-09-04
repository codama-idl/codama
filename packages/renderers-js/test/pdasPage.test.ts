import {
    constantPdaSeedNodeFromString,
    numberTypeNode,
    optionTypeNode,
    pdaNode,
    programNode,
    publicKeyTypeNode,
    variablePdaSeedNode,
} from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { renderMapContains, renderMapContainsImports, renderMapDoesNotContainImports } from './_setup';

test('it renders a PDA helper function and its input type', async () => {
    // Given the following PDA node.
    const node = programNode({
        name: 'myProgram',
        pdas: [
            pdaNode({
                name: 'foo',
                seeds: [
                    constantPdaSeedNodeFromString('utf8', 'myPrefix'),
                    variablePdaSeedNode('myAccount', publicKeyTypeNode()),
                    variablePdaSeedNode('myArg', numberTypeNode('u64')),
                ],
            }),
        ],
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following PDA function using an empty seeds array to derive the address.
    await renderMapContains(renderMap, 'pdas/foo.ts', [
        'export type FooSeeds = { myAccount: Address; myArg: number | bigint; }',
        'export async function findFooPda',
        "const { programAddress = '1111' as Address<'1111'> } = config;",
        "[ getUtf8Encoder().encode('myPrefix'), getAddressEncoder().encode(seeds.myAccount), getU64Encoder().encode(seeds.myArg) ]",
    ]);
});

test('it renders a PDA helper function with a default program address', async () => {
    // Given the following PDA node with a default program address.
    const node = programNode({
        name: 'myProgram',
        pdas: [
            pdaNode({
                name: 'foo',
                programId: 'myProgramId',
                seeds: [constantPdaSeedNodeFromString('utf8', 'myPrefix')],
            }),
        ],
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following PDA function using the programId as the default program address.
    await renderMapContains(renderMap, 'pdas/foo.ts', [
        'export async function findFooPda',
        "const { programAddress = 'myProgramId' as Address<'myProgramId'> } = config;",
    ]);
});

test('it renders an empty array of seeds for seedless PDAs', async () => {
    // Given the following program with 1 account and 1 pda with empty seeds.
    const node = programNode({
        name: 'myProgram',
        pdas: [pdaNode({ name: 'foo', seeds: [] })],
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following PDA function using an empty seeds array to derive the address.
    await renderMapContains(renderMap, 'pdas/foo.ts', [
        'export async function findFooPda',
        'getProgramDerivedAddress({ programAddress, seeds: [] })',
    ]);
});

test('it does not import strict types for variable seeds', async () => {
    // Given the following PDA node.
    const node = programNode({
        name: 'myProgram',
        pdas: [
            pdaNode({
                name: 'foo',
                seeds: [variablePdaSeedNode('myAccount', optionTypeNode(publicKeyTypeNode()))],
            }),
        ],
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then the `Option` string type should not be imported.
    await renderMapDoesNotContainImports(renderMap, 'pdas/foo.ts', {
        '@solana/web3.js': ['type Option'],
    });

    // But the `OptionOrNullable` loose type should be imported.
    await renderMapContainsImports(renderMap, 'pdas/foo.ts', {
        '@solana/web3.js': ['type OptionOrNullable'],
    });
});
