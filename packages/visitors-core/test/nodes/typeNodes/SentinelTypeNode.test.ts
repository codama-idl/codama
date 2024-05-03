import { constantValueNodeFromBytes, sentinelTypeNode, stringTypeNode } from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = sentinelTypeNode(stringTypeNode('utf8'), constantValueNodeFromBytes('base16', 'ffff'));

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 5);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[sentinelTypeNode]', null);
    expectDeleteNodesVisitor(node, '[stringTypeNode]', null);
    expectDeleteNodesVisitor(node, '[constantValueNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
sentinelTypeNode
|   constantValueNode
|   |   bytesTypeNode
|   |   bytesValueNode [base16.ffff]
|   stringTypeNode [utf8]`,
    );
});
