import { instructionByteDeltaNode, integerValueNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from './_setup';

const node = instructionByteDeltaNode(integerValueNode('42'), {
    subtract: true,
});

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 2);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[instructionByteDeltaNode]', null);
    expectDeleteNodesVisitor(node, '[integerValueNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
instructionByteDeltaNode [subtract.withHeader]
|   integerValueNode [42]`,
    );
});
