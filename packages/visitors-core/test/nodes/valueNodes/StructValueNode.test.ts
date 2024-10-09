import { numberValueNode, stringValueNode, structFieldValueNode, structValueNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = structValueNode([
    structFieldValueNode('name', stringValueNode('Alice')),
    structFieldValueNode('age', numberValueNode(42)),
]);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 5);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[structValueNode]', null);
    expectDeleteNodesVisitor(node, '[structFieldValueNode]', { ...node, fields: [] });
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
structValueNode
|   structFieldValueNode [name]
|   |   stringValueNode [Alice]
|   structFieldValueNode [age]
|   |   numberValueNode [42]`,
    );
});
