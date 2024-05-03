import { publicKeyTypeNode, publicKeyValueNode, structFieldTypeNode } from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = structFieldTypeNode({
    defaultValue: publicKeyValueNode('CzC5HidG6kR5J4haV7pKZmenYYVS7rw3SoBkqeStxZ9U'),
    name: 'owner',
    type: publicKeyTypeNode(),
});

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 3);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[structFieldTypeNode]', null);
    expectDeleteNodesVisitor(node, '[publicKeyTypeNode]', null);
    expectDeleteNodesVisitor(node, '[publicKeyValueNode]', structFieldTypeNode({ ...node, defaultValue: undefined }));
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
structFieldTypeNode [owner]
|   publicKeyTypeNode
|   publicKeyValueNode [CzC5HidG6kR5J4haV7pKZmenYYVS7rw3SoBkqeStxZ9U]`,
    );
});
