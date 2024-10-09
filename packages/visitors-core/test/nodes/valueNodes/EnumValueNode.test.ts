import {
    definedTypeLinkNode,
    enumValueNode,
    numberValueNode,
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

const node = enumValueNode(
    definedTypeLinkNode('entity'),
    'person',
    structValueNode([
        structFieldValueNode('name', stringValueNode('Alice')),
        structFieldValueNode('age', numberValueNode(42)),
    ]),
);

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
|   |   |   numberValueNode [42]`,
    );
});
