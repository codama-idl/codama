import { constantValueNode, hiddenPrefixTransformNode, integerTypeNode, integerValueNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = hiddenPrefixTransformNode([constantValueNode(integerTypeNode('u8'), integerValueNode('0'))]);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 4);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[hiddenPrefixTransformNode]', null);
    expectDeleteNodesVisitor(node, '[constantValueNode]', hiddenPrefixTransformNode([]));
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
hiddenPrefixTransformNode
|   constantValueNode
|   |   integerTypeNode [u8]
|   |   integerValueNode [0]`,
    );
});
