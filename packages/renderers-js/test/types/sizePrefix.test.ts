import { definedTypeNode, numberTypeNode, sizePrefixTypeNode, stringTypeNode } from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import test from 'ava';

import { getRenderMapVisitor } from '../../src/index.js';
import { renderMapContains, renderMapContainsImports } from '../_setup.js';

test('it renders size prefix codecs', async t => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u32')),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(t, renderMap, 'types/myType.ts', [
        'export type MyType = string',
        'addEncoderSizePrefix( getUtf8Encoder() , getU32Encoder() )',
        'addDecoderSizePrefix( getUtf8Decoder() , getU32Decoder() )',
    ]);

    // And we expect the following codec imports.
    await renderMapContainsImports(t, renderMap, 'types/myType.ts', {
        '@solana/codecs': ['addEncoderSizePrefix', 'addDecoderSizePrefix'],
    });
});
