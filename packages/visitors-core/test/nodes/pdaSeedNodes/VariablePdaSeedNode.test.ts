import { publicKeyTypeNode, variablePdaSeedNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = variablePdaSeedNode('mint', publicKeyTypeNode());

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 2);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[variablePdaSeedNode]', null);
    expectDeleteNodesVisitor(node, '[publicKeyTypeNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
variablePdaSeedNode [mint]
|   publicKeyTypeNode`,
    );
});
