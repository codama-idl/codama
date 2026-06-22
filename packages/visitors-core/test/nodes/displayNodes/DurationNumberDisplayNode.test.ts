import { durationNumberDisplayNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = durationNumberDisplayNode({ ticksPerSecond: 1 });

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 1);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[durationNumberDisplayNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(node, `durationNumberDisplayNode`);
});
