import { numberTypeNode, publicKeyTypeNode, structFieldTypeNode, structTypeNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = structTypeNode([
    structFieldTypeNode({ name: 'owner', type: publicKeyTypeNode() }),
    structFieldTypeNode({ name: 'amount', type: numberTypeNode('u64') }),
]);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 5);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[structTypeNode]', null);
    expectDeleteNodesVisitor(node, '[structFieldTypeNode]', { ...node, fields: [] });
    expectDeleteNodesVisitor(node, ['[publicKeyTypeNode]', '[numberTypeNode]'], { ...node, fields: [] });
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
structTypeNode
|   structFieldTypeNode [owner]
|   |   publicKeyTypeNode
|   structFieldTypeNode [amount]
|   |   numberTypeNode [u64]`,
    );
});
