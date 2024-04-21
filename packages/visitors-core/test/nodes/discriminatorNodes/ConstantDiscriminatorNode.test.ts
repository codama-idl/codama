import { constantDiscriminatorNode, constantValueNodeFromBytes } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = constantDiscriminatorNode(constantValueNodeFromBytes('base16', '01020304'), 42);

test(mergeVisitorMacro, node, 4);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[constantDiscriminatorNode]', null);
test(deleteNodesVisitorMacro, node, '[constantValueNode]', null);
test(
    getDebugStringVisitorMacro,
    node,
    `
constantDiscriminatorNode [offset:42]
|   constantValueNode
|   |   bytesTypeNode
|   |   bytesValueNode [base16.01020304]`,
);
