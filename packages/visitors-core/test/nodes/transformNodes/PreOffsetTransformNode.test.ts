import { preOffsetTransformNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = preOffsetTransformNode(4);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 1);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[preOffsetTransformNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(node, `preOffsetTransformNode [4.relative]`);
});
