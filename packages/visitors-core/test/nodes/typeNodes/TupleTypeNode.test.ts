import { numberTypeNode, publicKeyTypeNode, tupleTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = tupleTypeNode([publicKeyTypeNode(), numberTypeNode('u64')]);

test(mergeVisitorMacro, node, 3);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[tupleTypeNode]', null);
test(deleteNodesVisitorMacro, node, ['[publicKeyTypeNode]', '[numberTypeNode]'], { ...node, items: [] });
test(
    getDebugStringVisitorMacro,
    node,
    `
tupleTypeNode
|   publicKeyTypeNode
|   numberTypeNode [u64]`,
);
