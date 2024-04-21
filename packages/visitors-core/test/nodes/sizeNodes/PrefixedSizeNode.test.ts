import { numberTypeNode, prefixedCountNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = prefixedCountNode(numberTypeNode('u64'));

test(mergeVisitorMacro, node, 2);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[prefixedCountNode]', null);
test(deleteNodesVisitorMacro, node, '[numberTypeNode]', null);
test(
    getDebugStringVisitorMacro,
    node,
    `
prefixedCountNode
|   numberTypeNode [u64]`,
);
