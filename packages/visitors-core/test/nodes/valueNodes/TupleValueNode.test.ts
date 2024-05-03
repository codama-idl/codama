import { numberValueNode, publicKeyValueNode, stringValueNode, tupleValueNode } from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = tupleValueNode([
    stringValueNode('Hello'),
    numberValueNode(42),
    publicKeyValueNode('9sL9D2kshFgZSHz98pUQxGphwVUbCNBGqhYGaWWNJags'),
]);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 4);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[tupleValueNode]', null);
    expectDeleteNodesVisitor(node, ['[stringValueNode]', '[numberValueNode]', '[publicKeyValueNode]'], {
        ...node,
        items: [],
    });
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
tupleValueNode
|   stringValueNode [Hello]
|   numberValueNode [42]
|   publicKeyValueNode [9sL9D2kshFgZSHz98pUQxGphwVUbCNBGqhYGaWWNJags]`,
    );
});
