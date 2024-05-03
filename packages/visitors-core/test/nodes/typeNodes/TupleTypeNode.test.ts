import { numberTypeNode, publicKeyTypeNode, tupleTypeNode } from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = tupleTypeNode([publicKeyTypeNode(), numberTypeNode('u64')]);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 3);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[tupleTypeNode]', null);
    expectDeleteNodesVisitor(node, ['[publicKeyTypeNode]', '[numberTypeNode]'], { ...node, items: [] });
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
tupleTypeNode
|   publicKeyTypeNode
|   numberTypeNode [u64]`,
    );
});
