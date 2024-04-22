import { instructionArgumentNode, numberTypeNode, numberValueNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from './_setup.js';

const node = instructionArgumentNode({
    defaultValue: numberValueNode(1),
    name: 'amount',
    type: numberTypeNode('u64'),
});

test(mergeVisitorMacro, node, 3);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[instructionArgumentNode]', null);
test(deleteNodesVisitorMacro, node, '[numberTypeNode]', null);
test(
    deleteNodesVisitorMacro,
    node,
    '[numberValueNode]',
    instructionArgumentNode({ name: 'amount', type: numberTypeNode('u64') }),
);
test(
    getDebugStringVisitorMacro,
    node,
    `
instructionArgumentNode [amount]
|   numberTypeNode [u64]
|   numberValueNode [1]`,
);
