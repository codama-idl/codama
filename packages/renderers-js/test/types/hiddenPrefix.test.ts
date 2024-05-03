import {
    constantValueNodeFromBytes,
    constantValueNodeFromString,
    definedTypeNode,
    hiddenPrefixTypeNode,
    numberTypeNode,
} from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../../src';
import { renderMapContains, renderMapContainsImports } from '../_setup';

test('it renders hidden prefix codecs', async () => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: hiddenPrefixTypeNode(numberTypeNode('u32'), [
            constantValueNodeFromString('utf8', 'hello world'),
            constantValueNodeFromBytes('base16', 'ff'),
        ]),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/myType.ts', [
        'export type MyType = number',
        "getHiddenPrefixEncoder( getU32Encoder() , [ getConstantEncoder( getUtf8Encoder().encode('hello world') ), getConstantEncoder( new Uint8Array([ 255 ]) ) ] )",
        "getHiddenPrefixDecoder( getU32Decoder() , [ getConstantDecoder( getUtf8Encoder().encode('hello world') ), getConstantDecoder( new Uint8Array([ 255 ]) ) ] )",
    ]);

    // And we expect the following codec imports.
    await renderMapContainsImports(renderMap, 'types/myType.ts', {
        '@solana/web3.js': [
            'getHiddenPrefixEncoder',
            'getHiddenPrefixDecoder',
            'getConstantEncoder',
            'getConstantDecoder',
            'getUtf8Encoder',
        ],
    });
});
