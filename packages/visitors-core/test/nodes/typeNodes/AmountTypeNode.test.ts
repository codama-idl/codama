import { amountTypeNode, numberTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = amountTypeNode(numberTypeNode('u64'), 9, 'SOL');

test(mergeVisitorMacro, node, 2);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[amountTypeNode]', null);
test(deleteNodesVisitorMacro, node, '[numberTypeNode]', null);
test(
    getDebugStringVisitorMacro,
    node,
    `
amountTypeNode [9.SOL]
|   numberTypeNode [u64]`,
);
