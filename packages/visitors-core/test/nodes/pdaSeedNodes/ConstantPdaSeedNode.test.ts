import { constantPdaSeedNode, integerTypeNode, integerValueNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = constantPdaSeedNode(integerTypeNode('u8'), integerValueNode('42'));

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 3);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[constantPdaSeedNode]', null);
    expectDeleteNodesVisitor(node, '[integerTypeNode]', null);
    expectDeleteNodesVisitor(node, '[integerValueNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
constantPdaSeedNode
|   integerTypeNode [u8]
|   integerValueNode [42]`,
    );
});
