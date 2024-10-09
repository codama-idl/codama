import { sizeDiscriminatorNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = sizeDiscriminatorNode(42);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 1);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[sizeDiscriminatorNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(node, `sizeDiscriminatorNode [42]`);
});
