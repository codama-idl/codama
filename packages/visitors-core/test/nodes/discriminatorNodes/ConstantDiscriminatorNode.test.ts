import { constantDiscriminatorNode, constantValueNodeFromBytes } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = constantDiscriminatorNode(constantValueNodeFromBytes('base16', '01020304'), 42);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 4);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[constantDiscriminatorNode]', null);
    expectDeleteNodesVisitor(node, '[constantValueNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
constantDiscriminatorNode [offset:42]
|   constantValueNode
|   |   bytesTypeNode
|   |   bytesValueNode [base16.01020304]`,
    );
});
