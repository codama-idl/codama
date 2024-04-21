import { numberValueNode, publicKeyValueNode, stringValueNode, tupleValueNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = tupleValueNode([
    stringValueNode('Hello'),
    numberValueNode(42),
    publicKeyValueNode('9sL9D2kshFgZSHz98pUQxGphwVUbCNBGqhYGaWWNJags'),
]);

test(mergeVisitorMacro, node, 4);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[tupleValueNode]', null);
test(deleteNodesVisitorMacro, node, ['[stringValueNode]', '[numberValueNode]', '[publicKeyValueNode]'], {
    ...node,
    items: [],
});
test(
    getDebugStringVisitorMacro,
    node,
    `
tupleValueNode
|   stringValueNode [Hello]
|   numberValueNode [42]
|   publicKeyValueNode [9sL9D2kshFgZSHz98pUQxGphwVUbCNBGqhYGaWWNJags]`,
);
