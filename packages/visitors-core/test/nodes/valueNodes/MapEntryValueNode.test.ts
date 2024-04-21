import { mapEntryValueNode, publicKeyValueNode, stringValueNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = mapEntryValueNode(
    stringValueNode('Alice'),
    publicKeyValueNode('GaxDPeNfXXgtwJXwHiDYVSDiM53RchFSRFTn2z2Jztuw'),
);

test(mergeVisitorMacro, node, 3);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[mapEntryValueNode]', null);
test(deleteNodesVisitorMacro, node, '[stringValueNode]', null);
test(deleteNodesVisitorMacro, node, '[publicKeyValueNode]', null);
test(
    getDebugStringVisitorMacro,
    node,
    `
mapEntryValueNode
|   stringValueNode [Alice]
|   publicKeyValueNode [GaxDPeNfXXgtwJXwHiDYVSDiM53RchFSRFTn2z2Jztuw]`,
);
