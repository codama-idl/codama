import { fixedSizeTypeNode, stringTypeNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = fixedSizeTypeNode(stringTypeNode('utf8'), 42);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 2);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[fixedSizeTypeNode]', null);
    expectDeleteNodesVisitor(node, '[stringTypeNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
fixedSizeTypeNode [42]
|   stringTypeNode [utf8]`,
    );
});
