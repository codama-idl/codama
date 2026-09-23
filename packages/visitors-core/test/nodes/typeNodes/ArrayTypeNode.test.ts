import { arrayTypeNode, integerTypeNode, prefixedCountNode, publicKeyTypeNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = arrayTypeNode(publicKeyTypeNode(), prefixedCountNode(integerTypeNode('u64')));

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 4);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[arrayTypeNode]', null);
    expectDeleteNodesVisitor(node, '[publicKeyTypeNode]', null);
    expectDeleteNodesVisitor(node, '[prefixedCountNode]', null);
    expectDeleteNodesVisitor(node, '[integerTypeNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
arrayTypeNode
|   prefixedCountNode
|   |   integerTypeNode [u64]
|   publicKeyTypeNode`,
    );
});
