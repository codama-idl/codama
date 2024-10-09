import { definedTypeNode, fixedSizeTypeNode, stringTypeNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../../src';
import { renderMapContains, renderMapContainsImports } from '../_setup';

test('it renders fixed size codecs', async () => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: fixedSizeTypeNode(stringTypeNode('utf8'), 10),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/myType.ts', [
        'export type MyType = string',
        'fixEncoderSize( getUtf8Encoder() , 10 )',
        'fixDecoderSize( getUtf8Decoder() , 10 )',
    ]);

    // And we expect the following codec imports.
    await renderMapContainsImports(renderMap, 'types/myType.ts', {
        '@solana/web3.js': ['fixEncoderSize', 'fixDecoderSize'],
    });
});
