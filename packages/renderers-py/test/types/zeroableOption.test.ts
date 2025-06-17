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
import { renderMapContains } from '../_setup';

test('it renders zeroable option codecs', async () => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: zeroableOptionTypeNode(publicKeyTypeNode()),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());
    console.log(renderMap.get('types/myType.py'));

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/myType.py', [
        'MyType=ZeroableOption(BorshPubkey,None,"publicKey")',
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
    await renderMapContains(renderMap, 'types/myType.py', [
        'MyType=ZeroableOption(borsh.U16,Const(b"\\xff\\xff)","u16")',
        'pyType = int',
    ]);

    // And we expect the following codec imports.
    await renderMapContains(renderMap, 'types/myType.py', [
        'from construct import Const',
        'from ..shared import ZeroableOption',
        'import borsh_construct as borsh',
    ]);
});
