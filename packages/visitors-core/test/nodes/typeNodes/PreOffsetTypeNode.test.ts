import { preOffsetTypeNode, stringTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = preOffsetTypeNode(stringTypeNode('utf8'), 42);

test(mergeVisitorMacro, node, 2);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[stringTypeNode]', null);
test(deleteNodesVisitorMacro, node, '[preOffsetTypeNode]', null);
test(
    getDebugStringVisitorMacro,
    node,
    `
preOffsetTypeNode [42.relative]
|   stringTypeNode [utf8]`,
);

// Different strategy.
test(
    'getDebugStringVisitor: different strategy',
    getDebugStringVisitorMacro,
    preOffsetTypeNode(stringTypeNode('utf8'), 42, 'absolute'),
    `
preOffsetTypeNode [42.absolute]
|   stringTypeNode [utf8]`,
);
