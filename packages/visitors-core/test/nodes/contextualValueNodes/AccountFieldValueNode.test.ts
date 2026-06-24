import { accountFieldValueNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = accountFieldValueNode({ account: 'mint', path: 'decimals' });

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 1);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[accountFieldValueNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(node, `accountFieldValueNode`);
});
