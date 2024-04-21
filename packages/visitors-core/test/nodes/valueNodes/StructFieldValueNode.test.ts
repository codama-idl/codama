import { stringValueNode, structFieldValueNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = structFieldValueNode('name', stringValueNode('Alice'));

test(mergeVisitorMacro, node, 2);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[structFieldValueNode]', null);
test(deleteNodesVisitorMacro, node, '[stringValueNode]', null);
test(
    getDebugStringVisitorMacro,
    node,
    `
structFieldValueNode [name]
|   stringValueNode [Alice]`,
);
