import { enumVariantDisplayNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = enumVariantDisplayNode({ label: 'Buy', skipInnerData: false });

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 1);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[enumVariantDisplayNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(node, `enumVariantDisplayNode`);
});
