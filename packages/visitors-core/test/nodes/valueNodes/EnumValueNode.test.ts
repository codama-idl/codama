import {
    definedTypeLinkNode,
    enumValueNode,
    integerValueNode,
    stringValueNode,
    structFieldValueNode,
    structValueNode,
} from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = enumValueNode(definedTypeLinkNode('entity'), 'person', {
    value: structValueNode([
        structFieldValueNode('name', stringValueNode('Alice')),
        structFieldValueNode('age', integerValueNode('42')),
    ]),
});

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 7);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[enumValueNode]', null);
    expectDeleteNodesVisitor(node, '[definedTypeLinkNode]', null);
    expectDeleteNodesVisitor(node, '[structValueNode]', enumValueNode(node.enum, node.variant));
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
enumValueNode [person]
|   definedTypeLinkNode [entity]
|   structValueNode
|   |   structFieldValueNode [name]
|   |   |   stringValueNode [Alice]
|   |   structFieldValueNode [age]
|   |   |   integerValueNode [42]`,
    );
});

test('non-struct payloads', () => {
    const nodeWithInteger = enumValueNode(definedTypeLinkNode('operation'), 'amount', {
        value: integerValueNode('42'),
    });

    expectMergeVisitorCount(nodeWithInteger, 3);
    expectIdentityVisitor(nodeWithInteger);
    expectDeleteNodesVisitor(nodeWithInteger, '[integerValueNode]', enumValueNode(nodeWithInteger.enum, 'amount'));
    expectDebugStringVisitor(
        nodeWithInteger,
        `
enumValueNode [amount]
|   definedTypeLinkNode [operation]
|   integerValueNode [42]`,
    );
});
