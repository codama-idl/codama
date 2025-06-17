import { definedTypeNode, numberTypeNode, preOffsetTypeNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../../src';
import { renderMapContains } from '../_setup';

test('it renders relative pre-offset codecs', async () => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: preOffsetTypeNode(numberTypeNode('u32'), 4),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());
    //console.log(renderMap.get('types/myType.py'));

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/myType.py', ['MyType=PreOffset(borsh.U32, 4)', 'pyType = int']);

    // And we expect the following codec imports.
    await renderMapContains(renderMap, 'types/myType.py', ['from ..shared import PreOffset']);
});

test('it renders negative relative pre-offset codecs', async () => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: preOffsetTypeNode(numberTypeNode('u32'), -4),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/myType.py', ['MyType=PreOffset(borsh.U32, -4)', 'pyType = int']);

    // And we expect the following codec imports.
    await renderMapContains(renderMap, 'types/myType.py', ['from ..shared import PreOffset']);
});
/*
test('it renders absolute pre-offset codecs', async () => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: preOffsetTypeNode(numberTypeNode('u32'), 4, 'absolute'),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/myType.ts', [
        'export type MyType = number',
        'offsetEncoder( getU32Encoder() , { preOffset: () => 4 } )',
        'offsetDecoder( getU32Decoder() , { preOffset: () => 4 } )',
    ]);

    // And we expect the following codec imports.
    await renderMapContainsImports(renderMap, 'types/myType.ts', {
        '@solana/kit': ['offsetEncoder', 'offsetDecoder'],
    });
});

test('it renders negative absolute pre-offset codecs', async () => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: preOffsetTypeNode(numberTypeNode('u32'), -4, 'absolute'),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/myType.ts', [
        'export type MyType = number',
        'offsetEncoder( getU32Encoder() , { preOffset: ({ wrapBytes }) => wrapBytes(-4) } )',
        'offsetDecoder( getU32Decoder() , { preOffset: ({ wrapBytes }) => wrapBytes(-4) } )',
    ]);

    // And we expect the following codec imports.
    await renderMapContainsImports(renderMap, 'types/myType.ts', {
        '@solana/kit': ['offsetEncoder', 'offsetDecoder'],
    });
});

test('it renders padded pre-offset codecs', async () => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: preOffsetTypeNode(numberTypeNode('u32'), 4, 'padded'),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/myType.ts', [
        'export type MyType = number',
        'padLeftEncoder( getU32Encoder() , 4 )',
        'padLeftDecoder( getU32Decoder() , 4 )',
    ]);

    // And we expect the following codec imports.
    await renderMapContainsImports(renderMap, 'types/myType.ts', {
        '@solana/kit': ['padLeftEncoder', 'padLeftDecoder'],
    });
});
*/
