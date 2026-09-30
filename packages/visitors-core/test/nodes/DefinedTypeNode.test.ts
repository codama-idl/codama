import {
    addTypeNodeTransforms,
    definedTypeNode,
    fixedSizeTransformNode,
    integerTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from './_setup';

const node = definedTypeNode({
    identifier: 'person',
    type: structTypeNode([
        structFieldTypeNode({
            identifier: 'name',
            type: addTypeNodeTransforms(stringTypeNode('utf8'), [fixedSizeTransformNode(42)]),
        }),
        structFieldTypeNode({ identifier: 'age', type: integerTypeNode('u64') }),
    ]),
});

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 7);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[definedTypeNode]', null);
    expectDeleteNodesVisitor(node, '[structTypeNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
definedTypeNode [person]
|   structTypeNode
|   |   structFieldTypeNode [name]
|   |   |   stringTypeNode [utf8]
|   |   |   |   fixedSizeTransformNode [42]
|   |   structFieldTypeNode [age]
|   |   |   integerTypeNode [u64]`,
    );
});
