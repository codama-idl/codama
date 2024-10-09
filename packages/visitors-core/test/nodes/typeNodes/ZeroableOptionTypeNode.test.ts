import { constantValueNodeFromBytes, publicKeyTypeNode, zeroableOptionTypeNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = zeroableOptionTypeNode(publicKeyTypeNode(), constantValueNodeFromBytes('base16', 'ff'.repeat(32)));

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 5);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[zeroableOptionTypeNode]', null);
    expectDeleteNodesVisitor(node, '[publicKeyTypeNode]', null);
    expectDeleteNodesVisitor(node, '[constantValueNode]', zeroableOptionTypeNode(publicKeyTypeNode()));
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
zeroableOptionTypeNode
|   publicKeyTypeNode
|   constantValueNode
|   |   bytesTypeNode
|   |   bytesValueNode [base16.ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff]`,
    );

    expectDebugStringVisitor(
        zeroableOptionTypeNode(publicKeyTypeNode()),
        `
zeroableOptionTypeNode
|   publicKeyTypeNode`,
    );
});
