import { mapEntryValueNode, mapValueNode, integerValueNode, stringValueNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = mapValueNode([
    mapEntryValueNode(stringValueNode('Alice'), integerValueNode('42')),
    mapEntryValueNode(stringValueNode('Bob'), integerValueNode('37')),
    mapEntryValueNode(stringValueNode('Carla'), integerValueNode('29')),
]);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 10);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[mapValueNode]', null);
    expectDeleteNodesVisitor(node, '[mapEntryValueNode]', { ...node, entries: undefined });
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
mapValueNode
|   mapEntryValueNode
|   |   stringValueNode [Alice]
|   |   integerValueNode [42]
|   mapEntryValueNode
|   |   stringValueNode [Bob]
|   |   integerValueNode [37]
|   mapEntryValueNode
|   |   stringValueNode [Carla]
|   |   integerValueNode [29]`,
    );
});
