import { constantPdaSeedNode, numberTypeNode, numberValueNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = constantPdaSeedNode(numberTypeNode('u8'), numberValueNode(42));

test(mergeVisitorMacro, node, 3);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[constantPdaSeedNode]', null);
test(deleteNodesVisitorMacro, node, '[numberTypeNode]', null);
test(deleteNodesVisitorMacro, node, '[numberValueNode]', null);
test(
    getDebugStringVisitorMacro,
    node,
    `
constantPdaSeedNode
|   numberTypeNode [u8]
|   numberValueNode [42]`,
);
