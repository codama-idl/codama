import {
    accountNode,
    booleanTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumEmptyVariantTypeNode,
    enumTypeNode,
    enumValueNode,
    fieldDiscriminatorNode,
    pdaLinkNode,
    pdaNode,
    programNode,
    publicKeyTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { renderMapContains } from './_setup';

test('it renders PDA helpers for PDA with no seeds', async () => {
    // Given the following program with 1 account and 1 pda with empty seeds.
    const node = programNode({
        accounts: [accountNode({ name: 'foo', pda: pdaLinkNode('bar') })],
        name: 'myProgram',
        pdas: [pdaNode({ name: 'bar', seeds: [] })],
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following fetch helper functions delegating to findBarPda.
    await renderMapContains(renderMap, 'accounts/foo.ts', [
        'export async function fetchFooFromSeeds',
        'export async function fetchMaybeFooFromSeeds',
        'await findBarPda({ programAddress })',
    ]);
});

test('it renders an account with a defined type link as discriminator', async () => {
    // Given the following program with 1 account with a discriminator.
    const node = programNode({
        accounts: [
            accountNode({
                data: structTypeNode([
                    structFieldTypeNode({
                        defaultValue: enumValueNode('key', 'Asset'),
                        defaultValueStrategy: 'omitted',
                        name: 'key',
                        type: definedTypeLinkNode('Key'),
                    }),
                    structFieldTypeNode({
                        name: 'mutable',
                        type: booleanTypeNode(),
                    }),
                    structFieldTypeNode({
                        name: 'owner',
                        type: publicKeyTypeNode(),
                    }),
                ]),
                discriminators: [fieldDiscriminatorNode('key', 0)],
                name: 'asset',
            }),
        ],
        definedTypes: [
            definedTypeNode({
                name: 'key',
                type: enumTypeNode([enumEmptyVariantTypeNode('Uninitialized'), enumEmptyVariantTypeNode('Asset')]),
            }),
        ],
        name: 'splToken',
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    });

    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following import list with a reference to the disciminator type.
    await renderMapContains(renderMap, 'accounts/asset.ts', ['import { getKeyDecoder, getKeyEncoder, type Key }']);
});
