import { errorNode } from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from './_setup';

const node = errorNode({
    code: 42,
    message: 'The provided account does not match the owner of the token account.',
    name: 'InvalidTokenOwner',
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
    expectDebugStringVisitor(node, `errorNode [42.invalidTokenOwner]`);
});
