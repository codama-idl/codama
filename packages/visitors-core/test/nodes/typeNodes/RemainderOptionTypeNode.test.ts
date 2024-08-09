import { publicKeyTypeNode, remainderOptionTypeNode } from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = remainderOptionTypeNode(publicKeyTypeNode());

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 2);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[remainderOptionTypeNode]', null);
    expectDeleteNodesVisitor(node, '[publicKeyTypeNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
remainderOptionTypeNode
|   publicKeyTypeNode`,
    );
});
