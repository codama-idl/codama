import { enumEmptyVariantTypeNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = enumEmptyVariantTypeNode('initialized');

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 1);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[enumEmptyVariantTypeNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(node, `enumEmptyVariantTypeNode [initialized]`);
});
