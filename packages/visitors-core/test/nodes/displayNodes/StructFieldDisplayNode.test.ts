import { structFieldDisplayNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = structFieldDisplayNode({ label: 'Amount', skip: 'never' });

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 1);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[structFieldDisplayNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(node, `structFieldDisplayNode`);
});
