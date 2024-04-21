import {
    definedTypeNode,
    fixedSizeTypeNode,
    numberTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from './_setup.js';

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

test(mergeVisitorMacro, node, 7);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[definedTypeNode]', null);
test(deleteNodesVisitorMacro, node, '[structTypeNode]', null);
test(
    getDebugStringVisitorMacro,
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
