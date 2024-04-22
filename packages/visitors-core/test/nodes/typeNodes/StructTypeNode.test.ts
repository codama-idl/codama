import { numberTypeNode, publicKeyTypeNode, structFieldTypeNode, structTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = structTypeNode([
    structFieldTypeNode({ name: 'owner', type: publicKeyTypeNode() }),
    structFieldTypeNode({ name: 'amount', type: numberTypeNode('u64') }),
]);

test(mergeVisitorMacro, node, 5);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[structTypeNode]', null);
test(deleteNodesVisitorMacro, node, '[structFieldTypeNode]', {
    ...node,
    fields: [],
});
test(deleteNodesVisitorMacro, node, ['[publicKeyTypeNode]', '[numberTypeNode]'], { ...node, fields: [] });
test(
    getDebugStringVisitorMacro,
    node,
    `
structTypeNode
|   structFieldTypeNode [owner]
|   |   publicKeyTypeNode
|   structFieldTypeNode [amount]
|   |   numberTypeNode [u64]`,
);
