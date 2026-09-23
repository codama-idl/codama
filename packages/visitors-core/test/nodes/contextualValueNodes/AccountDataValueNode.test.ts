import { accountDataValueNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = accountDataValueNode('authority', { path: 'balance' });

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 1);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[accountDataValueNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(node, `accountDataValueNode [authority.balance]`);
});
