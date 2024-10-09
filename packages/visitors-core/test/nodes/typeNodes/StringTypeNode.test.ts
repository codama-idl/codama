import { stringTypeNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = stringTypeNode('utf8');

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 1);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[stringTypeNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(node, `stringTypeNode [utf8]`);
    expectDebugStringVisitor(stringTypeNode('base58'), `stringTypeNode [base58]`);
});
