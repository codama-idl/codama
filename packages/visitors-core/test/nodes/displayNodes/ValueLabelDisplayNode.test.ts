import { integerValueNode, valueLabelDisplayNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = valueLabelDisplayNode({ label: 'All', value: integerValueNode('18446744073709551615') });

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 2);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[valueLabelDisplayNode]', null);
    // `value` is required, so removing it removes the whole node.
    expectDeleteNodesVisitor(node, '[integerValueNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
valueLabelDisplayNode
|   integerValueNode [18446744073709551615]`,
    );
});
