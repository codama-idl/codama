import { bytesValueNode } from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = bytesValueNode('base64', 'SGVsbG8gV29ybGQ=');

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 1);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[bytesValueNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(node, `bytesValueNode [base64.SGVsbG8gV29ybGQ=]`);
});
