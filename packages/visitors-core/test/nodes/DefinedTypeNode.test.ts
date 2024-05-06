import {
    definedTypeNode,
    fixedSizeTypeNode,
    numberTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from './_setup';

const node = definedTypeNode({
    name: 'person',
    type: structTypeNode([
        structFieldTypeNode({
            name: 'name',
            type: fixedSizeTypeNode(stringTypeNode('utf8'), 42),
        }),
        structFieldTypeNode({ name: 'age', type: numberTypeNode('u64') }),
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
|   |   |   fixedSizeTypeNode [42]
|   |   |   |   stringTypeNode [utf8]
|   |   structFieldTypeNode [age]
|   |   |   numberTypeNode [u64]`,
    );
});
