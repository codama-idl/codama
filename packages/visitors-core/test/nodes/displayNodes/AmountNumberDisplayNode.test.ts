import { amountNumberDisplayNode, injectedValueNode, integerValueNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = amountNumberDisplayNode({
    decimals: integerValueNode('6'),
    unit: injectedValueNode({ key: 'symbol' }),
});

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 3);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[amountNumberDisplayNode]', null);
    // `decimals` is required, so removing it removes the whole node.
    expectDeleteNodesVisitor(node, '[integerValueNode]', null);
    expectDeleteNodesVisitor(node, '[injectedValueNode]', amountNumberDisplayNode({ decimals: integerValueNode('6') }));
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
amountNumberDisplayNode
|   integerValueNode [6]
|   injectedValueNode [symbol]`,
    );
});
