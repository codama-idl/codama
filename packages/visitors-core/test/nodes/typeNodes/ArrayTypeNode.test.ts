import { arrayTypeNode, numberTypeNode, prefixedCountNode, publicKeyTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = arrayTypeNode(publicKeyTypeNode(), prefixedCountNode(numberTypeNode('u64')));

test(mergeVisitorMacro, node, 4);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[arrayTypeNode]', null);
test(deleteNodesVisitorMacro, node, '[publicKeyTypeNode]', null);
test(deleteNodesVisitorMacro, node, '[prefixedCountNode]', null);
test(deleteNodesVisitorMacro, node, '[numberTypeNode]', null);
test(
    getDebugStringVisitorMacro,
    node,
    `
arrayTypeNode
|   prefixedCountNode
|   |   numberTypeNode [u64]
|   publicKeyTypeNode`,
);
