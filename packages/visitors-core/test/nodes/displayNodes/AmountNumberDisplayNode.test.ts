import { amountNumberDisplayNode, injectedValueNode, numberValueNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = amountNumberDisplayNode({
    decimals: numberValueNode(6),
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
    expectDeleteNodesVisitor(
        node,
        '[numberValueNode]',
        amountNumberDisplayNode({ unit: injectedValueNode({ key: 'symbol' }) }),
    );
    expectDeleteNodesVisitor(node, '[injectedValueNode]', amountNumberDisplayNode({ decimals: numberValueNode(6) }));
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
amountNumberDisplayNode
|   numberValueNode [6]
|   injectedValueNode`,
    );
});
