import { definedTypeNode, numberTypeNode, solAmountTypeNode } from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../../src';
import { renderMapContains, renderMapContainsImports } from '../_setup';

test('it renders size prefix codecs', async () => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: solAmountTypeNode(numberTypeNode('u64')),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/myType.ts', [
        'export type MyType = LamportsUnsafeBeyond2Pow53Minus1',
        'export type MyTypeArgs = MyType',
        'export function getMyTypeEncoder(): Encoder<MyTypeArgs> { return getLamportsEncoder(getU64Encoder()); }',
        'export function getMyTypeDecoder(): Decoder<MyType> { return getLamportsDecoder(getU64Decoder()); }',
    ]);

    // And we expect the following type and codec imports.
    await renderMapContainsImports(renderMap, 'types/myType.ts', {
        '@solana/web3.js': [
            'LamportsUnsafeBeyond2Pow53Minus1',
            'getLamportsEncoder',
            'getLamportsDecoder',
            'getU64Encoder',
            'getU64Decoder',
        ],
    });
});
