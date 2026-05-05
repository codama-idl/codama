import { constantNode, numberTypeNode, numberValueNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from './_setup';

const node = constantNode('maxItems', numberTypeNode('u64'), numberValueNode(1000));

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 3);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[constantNode]', null);
    expectDeleteNodesVisitor(node, '[numberTypeNode]', null);
    expectDeleteNodesVisitor(node, '[numberValueNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
constantNode [maxItems]
|   numberTypeNode [u64]
|   numberValueNode [1000]`,
    );
});
