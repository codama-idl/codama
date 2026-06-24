import { instructionAccountDisplayNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = instructionAccountDisplayNode({ label: 'To', skip: 'never' });

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 1);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[instructionAccountDisplayNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(node, `instructionAccountDisplayNode`);
});
