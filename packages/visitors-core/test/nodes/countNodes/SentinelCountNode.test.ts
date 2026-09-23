import { constantValueNode, integerTypeNode, integerValueNode, sentinelCountNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = sentinelCountNode(constantValueNode(integerTypeNode('u8'), integerValueNode('0')));

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 4);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[sentinelCountNode]', null);
    expectDeleteNodesVisitor(node, '[constantValueNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
sentinelCountNode
|   constantValueNode
|   |   integerTypeNode [u8]
|   |   integerValueNode [0]`,
    );
});
