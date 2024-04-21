import { fixedSizeTypeNode, stringTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = fixedSizeTypeNode(stringTypeNode('utf8'), 42);

test(mergeVisitorMacro, node, 2);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[stringTypeNode]', null);
test(deleteNodesVisitorMacro, node, '[fixedSizeTypeNode]', null);
test(
    getDebugStringVisitorMacro,
    node,
    `
fixedSizeTypeNode [42]
|   stringTypeNode [utf8]`,
);
