import { amountTypeNode, numberTypeNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = amountTypeNode(numberTypeNode('u64'), 9, 'SOL');

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 2);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[amountTypeNode]', null);
    expectDeleteNodesVisitor(node, '[numberTypeNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
amountTypeNode [9.SOL]
|   numberTypeNode [u64]`,
    );
});
