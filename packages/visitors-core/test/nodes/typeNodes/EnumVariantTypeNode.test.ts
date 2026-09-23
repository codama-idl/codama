import { enumVariantTypeNode, integerTypeNode, structFieldTypeNode, structTypeNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = enumVariantTypeNode('move', {
    data: structTypeNode([structFieldTypeNode({ identifier: 'x', type: integerTypeNode('u32') })]),
});

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 4);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[enumVariantTypeNode]', null);
    expectDeleteNodesVisitor(node, '[structTypeNode]', enumVariantTypeNode('move'));
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
enumVariantTypeNode [move]
|   structTypeNode
|   |   structFieldTypeNode [x]
|   |   |   integerTypeNode [u32]`,
    );
});
