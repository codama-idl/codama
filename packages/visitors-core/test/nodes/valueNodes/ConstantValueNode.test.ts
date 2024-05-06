import { constantValueNode, numberTypeNode, numberValueNode } from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = constantValueNode(numberTypeNode('u8'), numberValueNode(42));

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 3);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[constantValueNode]', null);
    expectDeleteNodesVisitor(node, '[numberTypeNode]', null);
    expectDeleteNodesVisitor(node, '[numberValueNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
constantValueNode
|   numberTypeNode [u8]
|   numberValueNode [42]`,
    );
});
