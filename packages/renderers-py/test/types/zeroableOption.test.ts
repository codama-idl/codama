import {
    constantValueNodeFromBytes,
    definedTypeNode,
    numberTypeNode,
    publicKeyTypeNode,
    zeroableOptionTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../../src';
import { renderMapContains, renderMapContainsImports } from '../_setup';

test('it renders zeroable option codecs', async () => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: zeroableOptionTypeNode(publicKeyTypeNode()),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/myType.py', [
        'MyType=ZeroableOption(BorshPubkey,None)',
        'pyType = SolPubkey',
    ]);

    // And we expect the following codec imports.
    await renderMapContains(renderMap, 'types/myType.py', [
        'from anchorpy.borsh_extension import BorshPubkey',
        'from solders.pubkey import Pubkey as SolPubkey',
        'from ..shared import ZeroableOption',
    ]);
});

test('it renders zeroable option codecs with custom zero values', async () => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: zeroableOptionTypeNode(numberTypeNode('u16'), constantValueNodeFromBytes('base16', 'ffff')),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());
    console.log(renderMap.get('types/myType.py'));

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/myType.ts', [
        'export type MyType = Option<number>',
        'export type MyTypeArgs = OptionOrNullable<number>',
        'getOptionEncoder( getU16Encoder(), { prefix: null, noneValue: new Uint8Array([255, 255]) } )',
        'getOptionDecoder( getU16Decoder(), { prefix: null, noneValue: new Uint8Array([255, 255]) } )',
    ]);

    // And we expect the following codec imports.
    await renderMapContainsImports(renderMap, 'types/myType.ts', {
        '@solana/kit': [
            'getOptionEncoder',
            'getOptionDecoder',
            'getU16Encoder',
            'getU16Decoder',
            'Option',
            'OptionOrNullable',
        ],
    });
});
