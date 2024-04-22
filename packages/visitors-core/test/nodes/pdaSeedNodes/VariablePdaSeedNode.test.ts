import { publicKeyTypeNode, variablePdaSeedNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = variablePdaSeedNode('mint', publicKeyTypeNode());

test(mergeVisitorMacro, node, 2);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[variablePdaSeedNode]', null);
test(deleteNodesVisitorMacro, node, '[publicKeyTypeNode]', null);
test(
    getDebugStringVisitorMacro,
    node,
    `
variablePdaSeedNode [mint]
|   publicKeyTypeNode`,
);
