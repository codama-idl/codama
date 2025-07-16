import { definedTypeNode, numberTypeNode, solAmountTypeNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
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
        'export type MyType = Lamports',
        'export type MyTypeArgs = MyType',
        'export function getMyTypeEncoder(): FixedSizeEncoder<MyTypeArgs> { return getLamportsEncoder(getU64Encoder()); }',
        'export function getMyTypeDecoder(): FixedSizeDecoder<MyType> { return getLamportsDecoder(getU64Decoder()); }',
    ]);

    // And we expect the following type and codec imports.
    await renderMapContainsImports(renderMap, 'types/myType.ts', {
        '@solana/kit': ['Lamports', 'getLamportsEncoder', 'getLamportsDecoder', 'getU64Encoder', 'getU64Decoder'],
    });
});
