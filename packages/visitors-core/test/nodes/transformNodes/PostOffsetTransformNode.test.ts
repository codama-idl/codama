import { postOffsetTransformNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = postOffsetTransformNode(4);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 1);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[postOffsetTransformNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(node, `postOffsetTransformNode [4.relative]`);
});
