import { constantValueNode, integerTypeNode, integerValueNode, sentinelTransformNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = sentinelTransformNode(constantValueNode(integerTypeNode('u8'), integerValueNode('0')));

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 4);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[sentinelTransformNode]', null);
    expectDeleteNodesVisitor(node, '[constantValueNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
sentinelTransformNode
|   constantValueNode
|   |   integerTypeNode [u8]
|   |   integerValueNode [0]`,
    );
});
