import { definedTypeNode, fixedSizeTypeNode, stringTypeNode } from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import test from 'ava';

import { getRenderMapVisitor } from '../../src/index.js';
import { renderMapContains, renderMapContainsImports } from '../_setup.js';

test('it renders fixed size codecs', async t => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: fixedSizeTypeNode(stringTypeNode('utf8'), 10),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(t, renderMap, 'types/myType.ts', [
        'export type MyType = string',
        'fixEncoderSize( getUtf8Encoder() , 10 )',
        'fixDecoderSize( getUtf8Decoder() , 10 )',
    ]);

    // And we expect the following codec imports.
    await renderMapContainsImports(t, renderMap, 'types/myType.ts', {
        '@solana/codecs': ['fixEncoderSize', 'fixDecoderSize'],
    });
});
