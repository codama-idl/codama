import { errorNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from './_setup';

const node = errorNode({
    code: 42,
    identifier: 'InvalidTokenOwner',
    message: 'The provided account does not match the owner of the token account.',
});

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 1);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[errorNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(node, `errorNode [42.InvalidTokenOwner]`);
});
