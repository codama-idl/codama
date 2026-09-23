import { constantNode, integerTypeNode, integerValueNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from './_setup';

const node = constantNode('maxItems', integerTypeNode('u64'), integerValueNode('1000'));

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 3);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[constantNode]', null);
    expectDeleteNodesVisitor(node, '[integerTypeNode]', null);
    expectDeleteNodesVisitor(node, '[integerValueNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
constantNode [maxItems]
|   integerTypeNode [u64]
|   integerValueNode [1000]`,
    );
});
