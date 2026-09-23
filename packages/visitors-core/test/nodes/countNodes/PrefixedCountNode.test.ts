import { integerTypeNode, prefixedCountNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = prefixedCountNode(integerTypeNode('u32'));

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 2);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[prefixedCountNode]', null);
    expectDeleteNodesVisitor(node, '[integerTypeNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
prefixedCountNode
|   integerTypeNode [u32]`,
    );
});
