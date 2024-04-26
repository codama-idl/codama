import {
    constantValueNodeFromBytes,
    definedTypeNode,
    numberTypeNode,
    publicKeyTypeNode,
    zeroableOptionTypeNode,
} from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import test from 'ava';

import { getRenderMapVisitor } from '../../src/index.js';
import { renderMapContains, renderMapContainsImports } from '../_setup.js';

test('it renders zeroable option codecs', t => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: zeroableOptionTypeNode(publicKeyTypeNode()),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following types and codecs to be exported.
    renderMapContains(t, renderMap, 'types/myType.ts', [
        'export type MyType = Option<Address>',
        'export type MyTypeArgs = OptionOrNullable<Address>',
        'getZeroableOptionEncoder( getAddressEncoder() )',
        'getZeroableOptionDecoder( getAddressDecoder() )',
    ]);

    // And we expect the following codec imports.
    renderMapContainsImports(t, renderMap, 'types/myType.ts', {
        '@solana/web3.js': [
            'getZeroableOptionEncoder',
            'getZeroableOptionDecoder',
            'getAddressEncoder',
            'getAddressDecoder',
            'Option',
            'OptionOrNullable',
        ],
    });
});

test('it renders zeroable option codecs with custom zero values', t => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: zeroableOptionTypeNode(numberTypeNode('u16'), constantValueNodeFromBytes('base16', 'ffff')),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following types and codecs to be exported.
    renderMapContains(t, renderMap, 'types/myType.ts', [
        'export type MyType = Option<number>',
        'export type MyTypeArgs = OptionOrNullable<number>',
        'getZeroableOptionEncoder( getU16Encoder(), { zeroValue: new Uint8Array([255, 255]) } )',
        'getZeroableOptionDecoder( getU16Decoder(), { zeroValue: new Uint8Array([255, 255]) } )',
    ]);

    // And we expect the following codec imports.
    renderMapContainsImports(t, renderMap, 'types/myType.ts', {
        '@solana/web3.js': [
            'getZeroableOptionEncoder',
            'getZeroableOptionDecoder',
            'getU16Encoder',
            'getU16Decoder',
            'Option',
            'OptionOrNullable',
        ],
    });
});
