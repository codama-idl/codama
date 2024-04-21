import { dateTimeTypeNode, numberTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = dateTimeTypeNode(numberTypeNode('u64'));

test(mergeVisitorMacro, node, 2);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[dateTimeTypeNode]', null);
test(deleteNodesVisitorMacro, node, '[numberTypeNode]', null);
test(
    getDebugStringVisitorMacro,
    node,
    `
dateTimeTypeNode
|   numberTypeNode [u64]`,
);
