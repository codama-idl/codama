import { publicKeyTypeNode, publicKeyValueNode, structFieldTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = structFieldTypeNode({
    defaultValue: publicKeyValueNode('CzC5HidG6kR5J4haV7pKZmenYYVS7rw3SoBkqeStxZ9U'),
    name: 'owner',
    type: publicKeyTypeNode(),
});

test(mergeVisitorMacro, node, 3);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[structFieldTypeNode]', null);
test(deleteNodesVisitorMacro, node, '[publicKeyTypeNode]', null);
test(deleteNodesVisitorMacro, node, '[publicKeyValueNode]', structFieldTypeNode({ ...node, defaultValue: undefined }));
test(
    getDebugStringVisitorMacro,
    node,
    `
structFieldTypeNode [owner]
|   publicKeyTypeNode
|   publicKeyValueNode [CzC5HidG6kR5J4haV7pKZmenYYVS7rw3SoBkqeStxZ9U]`,
);
