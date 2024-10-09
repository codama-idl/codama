import { instructionByteDeltaNode, numberValueNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from './_setup';

const node = instructionByteDeltaNode(numberValueNode(42), {
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
    expectDeleteNodesVisitor(node, '[numberValueNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
instructionByteDeltaNode [subtract.withHeader]
|   numberValueNode [42]`,
    );
});
