import { accountLinkNode, publicKeyTypeNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = publicKeyTypeNode();

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 1);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[publicKeyTypeNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(node, `publicKeyTypeNode`);
});

test('it visits the account link of public keys', () => {
    const linkedNode = publicKeyTypeNode({ accountLink: accountLinkNode('mint') });
    expectMergeVisitorCount(linkedNode, 2);
    expectIdentityVisitor(linkedNode);
    expectDeleteNodesVisitor(linkedNode, '[accountLinkNode]', publicKeyTypeNode());
    expectDebugStringVisitor(
        linkedNode,
        `
publicKeyTypeNode
|   accountLinkNode [mint]`,
    );
});
