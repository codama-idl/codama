import {
    constantValueNodeFromBytes,
    constantValueNodeFromString,
    definedTypeNode,
    hiddenSuffixTypeNode,
    numberTypeNode,
} from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import test from 'ava';

import { getRenderMapVisitor } from '../../src/index.js';
import { renderMapContains, renderMapContainsImports } from '../_setup.js';

test('it renders hidden suffix codecs', async t => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: hiddenSuffixTypeNode(numberTypeNode('u32'), [
            constantValueNodeFromString('utf8', 'hello world'),
            constantValueNodeFromBytes('base16', 'ff'),
        ]),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(t, renderMap, 'types/myType.ts', [
        'export type MyType = number',
        "getHiddenSuffixEncoder( getU32Encoder() , [ getConstantEncoder( getUtf8Encoder().encode('hello world') ), getConstantEncoder( new Uint8Array([ 255 ]) ) ] )",
        "getHiddenSuffixDecoder( getU32Decoder() , [ getConstantDecoder( getUtf8Encoder().encode('hello world') ), getConstantDecoder( new Uint8Array([ 255 ]) ) ] )",
    ]);

    // And we expect the following codec imports.
    await renderMapContainsImports(t, renderMap, 'types/myType.ts', {
        '@solana/codecs': [
            'getHiddenSuffixEncoder',
            'getHiddenSuffixDecoder',
            'getConstantEncoder',
            'getConstantDecoder',
            'getUtf8Encoder',
        ],
    });
});
