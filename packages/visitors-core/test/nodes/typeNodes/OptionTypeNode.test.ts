import { numberTypeNode, optionTypeNode, publicKeyTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = optionTypeNode(publicKeyTypeNode(), {
    fixed: true,
    prefix: numberTypeNode('u64'),
});

test(mergeVisitorMacro, node, 3);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[optionTypeNode]', null);
test(deleteNodesVisitorMacro, node, '[publicKeyTypeNode]', null);
test(deleteNodesVisitorMacro, node, '[numberTypeNode]', null);
test(
    getDebugStringVisitorMacro,
    node,
    `
optionTypeNode [fixed]
|   numberTypeNode [u64]
|   publicKeyTypeNode`,
);
