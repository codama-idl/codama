import { definedTypeNode, numberTypeNode, solAmountTypeNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../../src';
import { renderMapContains } from '../_setup';

test('it renders size prefix codecs', async () => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: solAmountTypeNode(numberTypeNode('u64')),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());
    console.log(renderMap.get('types/myType.py'));

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/myType.py', ['MyType=borsh.U64', 'pyType = int']);
});
