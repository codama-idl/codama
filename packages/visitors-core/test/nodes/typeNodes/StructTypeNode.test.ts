import { integerTypeNode, publicKeyTypeNode, structFieldTypeNode, structTypeNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = structTypeNode([
    structFieldTypeNode({ identifier: 'owner', type: publicKeyTypeNode() }),
    structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') }),
]);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 5);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[structTypeNode]', null);
    expectDeleteNodesVisitor(node, '[structFieldTypeNode]', { ...node, fields: undefined });
    expectDeleteNodesVisitor(node, ['[publicKeyTypeNode]', '[integerTypeNode]'], { ...node, fields: undefined });
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
structTypeNode
|   structFieldTypeNode [owner]
|   |   publicKeyTypeNode
|   structFieldTypeNode [amount]
|   |   integerTypeNode [u64]`,
    );
});
