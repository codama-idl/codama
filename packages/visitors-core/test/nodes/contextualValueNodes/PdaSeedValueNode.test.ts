import { accountValueNode, pdaSeedValueNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = pdaSeedValueNode('mint', accountValueNode('mint'));

test(mergeVisitorMacro, node, 2);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[pdaSeedValueNode]', null);
test(deleteNodesVisitorMacro, node, '[accountValueNode]', null);
test(
    getDebugStringVisitorMacro,
    node,
    `
pdaSeedValueNode [mint]
|   accountValueNode [mint]`,
);
