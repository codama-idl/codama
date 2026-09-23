import {
    addTypeNodeTransforms,
    fixedSizeTransformNode,
    integerTypeNode,
    mapTypeNode,
    prefixedCountNode,
    publicKeyTypeNode,
    stringTypeNode,
} from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = mapTypeNode(
    addTypeNodeTransforms(stringTypeNode('utf8'), [fixedSizeTransformNode(32)]),
    publicKeyTypeNode(),
    prefixedCountNode(integerTypeNode('u8')),
);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 6);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[mapTypeNode]', null);
    expectDeleteNodesVisitor(node, '[stringTypeNode]', null);
    expectDeleteNodesVisitor(node, '[publicKeyTypeNode]', null);
    expectDeleteNodesVisitor(node, '[prefixedCountNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
mapTypeNode
|   prefixedCountNode
|   |   integerTypeNode [u8]
|   stringTypeNode [utf8]
|   |   fixedSizeTransformNode [32]
|   publicKeyTypeNode`,
    );
});
