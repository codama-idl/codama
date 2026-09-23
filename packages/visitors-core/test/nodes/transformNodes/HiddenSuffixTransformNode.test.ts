import { constantValueNode, hiddenSuffixTransformNode, integerTypeNode, integerValueNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = hiddenSuffixTransformNode([constantValueNode(integerTypeNode('u8'), integerValueNode('0'))]);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 4);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[hiddenSuffixTransformNode]', null);
    expectDeleteNodesVisitor(node, '[constantValueNode]', hiddenSuffixTransformNode([]));
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
hiddenSuffixTransformNode
|   constantValueNode
|   |   integerTypeNode [u8]
|   |   integerValueNode [0]`,
    );
});
