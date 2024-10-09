import { stringValueNode, structFieldValueNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = structFieldValueNode('name', stringValueNode('Alice'));

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 2);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[structFieldValueNode]', null);
    expectDeleteNodesVisitor(node, '[stringValueNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
structFieldValueNode [name]
|   stringValueNode [Alice]`,
    );
});
