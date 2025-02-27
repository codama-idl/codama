import { constantValueNodeFromBytes, definedTypeNode, sentinelTypeNode, stringTypeNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../../src';
import { renderMapContains, renderMapContainsImports } from '../_setup';

test('it renders sentinel codecs', async () => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: sentinelTypeNode(stringTypeNode('utf8'), constantValueNodeFromBytes('base16', 'ff')),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/myType.ts', [
        'export type MyType = string',
        'addEncoderSentinel( getUtf8Encoder() , new Uint8Array([ 255 ]) )',
        'addDecoderSentinel( getUtf8Decoder() ,  new Uint8Array([ 255 ]) )',
    ]);

    // And we expect the following codec imports.
    await renderMapContainsImports(renderMap, 'types/myType.ts', {
        '@solana/kit': ['addEncoderSentinel', 'addDecoderSentinel'],
    });
});
