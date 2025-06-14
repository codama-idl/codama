import { definedTypeNode, numberTypeNode, postOffsetTypeNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect,test } from 'vitest';

import { getRenderMapVisitor } from '../../src';
import { renderMapContains } from '../_setup';

test('it renders relative post-offset codecs', async () => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: postOffsetTypeNode(numberTypeNode('u32'), 4),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());
    //console.log(renderMap.get('types/myType.py'));

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/myType.py', ['MyType=PostOffset(borsh.U32, 4)', 'pyType = int']);

    // And we expect the following codec imports.
    await renderMapContains(renderMap, 'types/myType.py', ['from ..shared import PostOffset']);
});

test('it renders negative relative post-offset codecs', async () => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: postOffsetTypeNode(numberTypeNode('u32'), -4),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/myType.py', ['MyType=PostOffset(borsh.U32, -4)', 'pyType = int']);

    // And we expect the following codec imports.
    await renderMapContains(renderMap, 'types/myType.py', ['from ..shared import PostOffset']);
});

test('it renders absolute post-offset codecs', () => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: postOffsetTypeNode(numberTypeNode('u32'), 4, 'absolute'),
    });

    expect(() => visit(node, getRenderMapVisitor())).toThrowError('PostOffset type absolute not supported by Borsh');
});
/*
test('it renders negative absolute post-offset codecs', async () => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: postOffsetTypeNode(numberTypeNode('u32'), -4, 'absolute'),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/myType.ts', [
        'export type MyType = number',
        'offsetEncoder( getU32Encoder() , { postOffset: ({ wrapBytes }) => wrapBytes(-4) } )',
        'offsetDecoder( getU32Decoder() , { postOffset: ({ wrapBytes }) => wrapBytes(-4) } )',
    ]);

    // And we expect the following codec imports.
    await renderMapContainsImports(renderMap, 'types/myType.ts', {
        '@solana/kit': ['offsetEncoder', 'offsetDecoder'],
    });
});

test('it renders padded post-offset codecs', async () => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: postOffsetTypeNode(numberTypeNode('u32'), 4, 'padded'),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/myType.ts', [
        'export type MyType = number',
        'padRightEncoder( getU32Encoder() , 4 )',
        'padRightDecoder( getU32Decoder() , 4 )',
    ]);

    // And we expect the following codec imports.
    await renderMapContainsImports(renderMap, 'types/myType.ts', {
        '@solana/kit': ['padRightEncoder', 'padRightDecoder'],
    });
});

test('it renders post-offset codecs relative to the pre-offset', async () => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: postOffsetTypeNode(numberTypeNode('u32'), 4, 'preOffset'),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/myType.ts', [
        'export type MyType = number',
        'offsetEncoder( getU32Encoder() , { postOffset: ({ preOffset }) => preOffset + 4 } )',
        'offsetDecoder( getU32Decoder() , { postOffset: ({ preOffset }) => preOffset + 4 } )',
    ]);

    // And we expect the following codec imports.
    await renderMapContainsImports(renderMap, 'types/myType.ts', {
        '@solana/kit': ['offsetEncoder', 'offsetDecoder'],
    });
});

test('it renders negative post-offset codecs relative to the pre-offset', async () => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: postOffsetTypeNode(numberTypeNode('u32'), -4, 'preOffset'),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/myType.ts', [
        'export type MyType = number',
        'offsetEncoder( getU32Encoder() , { postOffset: ({ preOffset }) => preOffset - 4 } )',
        'offsetDecoder( getU32Decoder() , { postOffset: ({ preOffset }) => preOffset - 4 } )',
    ]);

    // And we expect the following codec imports.
    await renderMapContainsImports(renderMap, 'types/myType.ts', {
        '@solana/kit': ['offsetEncoder', 'offsetDecoder'],
    });
});
*/
