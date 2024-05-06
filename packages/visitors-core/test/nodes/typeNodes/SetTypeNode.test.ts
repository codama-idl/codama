import { publicKeyTypeNode, remainderCountNode, setTypeNode } from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = setTypeNode(publicKeyTypeNode(), remainderCountNode());

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 3);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[setTypeNode]', null);
    expectDeleteNodesVisitor(node, '[publicKeyTypeNode]', null);
    expectDeleteNodesVisitor(node, '[remainderCountNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
setTypeNode
|   remainderCountNode
|   publicKeyTypeNode`,
    );
});
