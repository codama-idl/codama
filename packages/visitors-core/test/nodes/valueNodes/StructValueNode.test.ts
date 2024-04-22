import { numberValueNode, stringValueNode, structFieldValueNode, structValueNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = structValueNode([
    structFieldValueNode('name', stringValueNode('Alice')),
    structFieldValueNode('age', numberValueNode(42)),
]);

test(mergeVisitorMacro, node, 5);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[structValueNode]', null);
test(deleteNodesVisitorMacro, node, '[structFieldValueNode]', {
    ...node,
    fields: [],
});
test(
    getDebugStringVisitorMacro,
    node,
    `
structValueNode
|   structFieldValueNode [name]
|   |   stringValueNode [Alice]
|   structFieldValueNode [age]
|   |   numberValueNode [42]`,
);
