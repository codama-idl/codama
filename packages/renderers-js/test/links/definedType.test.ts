import {
    definedTypeLinkNode,
    definedTypeNode,
    fixedSizeTypeNode,
    programNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../../src';
import { renderMapContains, renderMapContainsImports } from '../_setup';

test('it imports types and functions from the linked type', async () => {
    // Given the following node.
    const node = programNode({
        definedTypes: [
            definedTypeNode({
                name: 'symbol',
                type: fixedSizeTypeNode(stringTypeNode('utf8'), 5),
            }),
            definedTypeNode({
                name: 'metadata',
                type: structTypeNode([
                    structFieldTypeNode({ name: 'identifier', type: definedTypeLinkNode('symbol') }),
                ]),
            }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/metadata.ts', [
        'export type Metadata = { identifier: Symbol }',
        'export type MetadataArgs = { identifier: SymbolArgs }',
        'getSymbolEncoder()',
        'getSymbolDecoder()',
    ]);

    // And we expect the following imports.
    await renderMapContainsImports(renderMap, 'types/metadata.ts', {
        '.': ['Symbol', 'SymbolArgs', 'getSymbolEncoder', 'getSymbolDecoder'],
    });
});

test('it can override the import of a linked type', async () => {
    // Given the following node.
    const node = programNode({
        definedTypes: [
            definedTypeNode({
                name: 'symbol',
                type: fixedSizeTypeNode(stringTypeNode('utf8'), 5),
            }),
            definedTypeNode({
                name: 'metadata',
                type: structTypeNode([
                    structFieldTypeNode({ name: 'identifier', type: definedTypeLinkNode('symbol') }),
                ]),
            }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we render it using a custom import.
    const renderMap = visit(
        node,
        getRenderMapVisitor({
            linkOverrides: {
                definedTypes: { symbol: 'hooked' },
            },
        }),
    );

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/metadata.ts', [
        'export type Metadata = { identifier: Symbol }',
        'export type MetadataArgs = { identifier: SymbolArgs }',
        'getSymbolEncoder()',
        'getSymbolDecoder()',
    ]);

    // And we expect the imports to be overridden.
    await renderMapContainsImports(renderMap, 'types/metadata.ts', {
        '../../hooked': ['Symbol', 'SymbolArgs', 'getSymbolEncoder', 'getSymbolDecoder'],
    });
});
