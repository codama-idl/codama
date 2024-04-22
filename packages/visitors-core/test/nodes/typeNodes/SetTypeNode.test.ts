import { publicKeyTypeNode, remainderCountNode, setTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = setTypeNode(publicKeyTypeNode(), remainderCountNode());

test(mergeVisitorMacro, node, 3);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[setTypeNode]', null);
test(deleteNodesVisitorMacro, node, '[publicKeyTypeNode]', null);
test(deleteNodesVisitorMacro, node, '[remainderCountNode]', null);
test(
    getDebugStringVisitorMacro,
    node,
    `
setTypeNode
|   remainderCountNode
|   publicKeyTypeNode`,
);
