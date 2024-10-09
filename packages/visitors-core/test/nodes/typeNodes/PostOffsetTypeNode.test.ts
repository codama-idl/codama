import { postOffsetTypeNode, stringTypeNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = postOffsetTypeNode(stringTypeNode('utf8'), 42);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 2);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[stringTypeNode]', null);
    expectDeleteNodesVisitor(node, '[postOffsetTypeNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
postOffsetTypeNode [42.relative]
|   stringTypeNode [utf8]`,
    );

    expectDebugStringVisitor(
        postOffsetTypeNode(stringTypeNode('utf8'), 42, 'absolute'),
        `
postOffsetTypeNode [42.absolute]
|   stringTypeNode [utf8]`,
    );
});
