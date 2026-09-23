import { stringValueNode, unitNumberDisplayNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = unitNumberDisplayNode({ unit: stringValueNode('SOL') });

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 2);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[unitNumberDisplayNode]', null);
    expectDeleteNodesVisitor(node, '[stringValueNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
unitNumberDisplayNode
|   stringValueNode [SOL]`,
    );
});
