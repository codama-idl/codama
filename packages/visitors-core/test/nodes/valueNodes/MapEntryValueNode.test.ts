import { mapEntryValueNode, publicKeyValueNode, stringValueNode } from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = mapEntryValueNode(
    stringValueNode('Alice'),
    publicKeyValueNode('GaxDPeNfXXgtwJXwHiDYVSDiM53RchFSRFTn2z2Jztuw'),
);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 3);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[mapEntryValueNode]', null);
    expectDeleteNodesVisitor(node, '[stringValueNode]', null);
    expectDeleteNodesVisitor(node, '[publicKeyValueNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
mapEntryValueNode
|   stringValueNode [Alice]
|   publicKeyValueNode [GaxDPeNfXXgtwJXwHiDYVSDiM53RchFSRFTn2z2Jztuw]`,
    );
});
