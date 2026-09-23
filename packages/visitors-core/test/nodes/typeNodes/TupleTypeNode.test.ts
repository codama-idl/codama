import { integerTypeNode, publicKeyTypeNode, tupleTypeNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = tupleTypeNode([publicKeyTypeNode(), integerTypeNode('u64')]);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 3);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[tupleTypeNode]', null);
    expectDeleteNodesVisitor(node, ['[publicKeyTypeNode]', '[integerTypeNode]'], { ...node, items: undefined });
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
tupleTypeNode
|   publicKeyTypeNode
|   integerTypeNode [u64]`,
    );
});
