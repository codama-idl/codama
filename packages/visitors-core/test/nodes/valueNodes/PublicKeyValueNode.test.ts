import { publicKeyValueNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = publicKeyValueNode('HqJgWgvkn5wMGU8LpzkRw8389N5Suvu2nZcmpya9JyJB');

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 1);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[publicKeyValueNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(node, `publicKeyValueNode [HqJgWgvkn5wMGU8LpzkRw8389N5Suvu2nZcmpya9JyJB]`);
    expectDebugStringVisitor(
        publicKeyValueNode('HqJgWgvkn5wMGU8LpzkRw8389N5Suvu2nZcmpya9JyJB', 'myIdentifier'),
        `publicKeyValueNode [myIdentifier.HqJgWgvkn5wMGU8LpzkRw8389N5Suvu2nZcmpya9JyJB]`,
    );
});
