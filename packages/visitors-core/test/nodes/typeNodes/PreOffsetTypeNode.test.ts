import { preOffsetTypeNode, stringTypeNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = preOffsetTypeNode(stringTypeNode('utf8'), 42);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 2);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[stringTypeNode]', null);
    expectDeleteNodesVisitor(node, '[preOffsetTypeNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
preOffsetTypeNode [42.relative]
|   stringTypeNode [utf8]`,
    );

    expectDebugStringVisitor(
        preOffsetTypeNode(stringTypeNode('utf8'), 42, 'absolute'),
        `
preOffsetTypeNode [42.absolute]
|   stringTypeNode [utf8]`,
    );
});
