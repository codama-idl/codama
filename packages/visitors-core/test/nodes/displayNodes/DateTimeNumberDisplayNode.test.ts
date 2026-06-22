import { dateTimeNumberDisplayNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = dateTimeNumberDisplayNode({ ticksPerSecond: 1000 });

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 1);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[dateTimeNumberDisplayNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(node, `dateTimeNumberDisplayNode`);
});
