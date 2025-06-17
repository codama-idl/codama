import { definedTypeNode, publicKeyTypeNode, remainderOptionTypeNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../../src';
import { renderMapContains } from '../_setup';

test('it renders remainder option codecs', async () => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: remainderOptionTypeNode(publicKeyTypeNode()),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());
    //console.log(renderMap.get('types/myType.py'));

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/myType.py', [
        'MyType=RemainderOption(BorshPubkey)',
        'pyType = SolPubkey',
    ]);

    // And we expect the following codec imports.
    await renderMapContains(renderMap, 'types/myType.py', ['from ..shared import RemainderOption']);
});
