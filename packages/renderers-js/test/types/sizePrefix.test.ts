import { definedTypeNode, numberTypeNode, sizePrefixTypeNode, stringTypeNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../../src';
import { renderMapContains, renderMapContainsImports } from '../_setup';

test('it renders size prefix codecs', async () => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u32')),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/myType.ts', [
        'export type MyType = string',
        'addEncoderSizePrefix( getUtf8Encoder() , getU32Encoder() )',
        'addDecoderSizePrefix( getUtf8Decoder() , getU32Decoder() )',
    ]);

    // And we expect the following codec imports.
    await renderMapContainsImports(renderMap, 'types/myType.ts', {
        '@solana/web3.js': ['addEncoderSizePrefix', 'addDecoderSizePrefix'],
    });
});
