import { mapEntryValueNode, mapValueNode, numberValueNode, stringValueNode } from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = mapValueNode([
    mapEntryValueNode(stringValueNode('Alice'), numberValueNode(42)),
    mapEntryValueNode(stringValueNode('Bob'), numberValueNode(37)),
    mapEntryValueNode(stringValueNode('Carla'), numberValueNode(29)),
]);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 10);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[mapValueNode]', null);
    expectDeleteNodesVisitor(node, '[mapEntryValueNode]', { ...node, entries: [] });
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
mapValueNode
|   mapEntryValueNode
|   |   stringValueNode [Alice]
|   |   numberValueNode [42]
|   mapEntryValueNode
|   |   stringValueNode [Bob]
|   |   numberValueNode [37]
|   mapEntryValueNode
|   |   stringValueNode [Carla]
|   |   numberValueNode [29]`,
    );
});
