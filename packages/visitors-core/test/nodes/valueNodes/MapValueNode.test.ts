import { mapEntryValueNode, mapValueNode, numberValueNode, stringValueNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = mapValueNode([
    mapEntryValueNode(stringValueNode('Alice'), numberValueNode(42)),
    mapEntryValueNode(stringValueNode('Bob'), numberValueNode(37)),
    mapEntryValueNode(stringValueNode('Carla'), numberValueNode(29)),
]);

test(mergeVisitorMacro, node, 10);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[mapValueNode]', null);
test(deleteNodesVisitorMacro, node, '[mapEntryValueNode]', {
    ...node,
    entries: [],
});
test(
    getDebugStringVisitorMacro,
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
