import {
    fixedSizeTypeNode,
    mapTypeNode,
    numberTypeNode,
    prefixedCountNode,
    publicKeyTypeNode,
    stringTypeNode,
} from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = mapTypeNode(
    fixedSizeTypeNode(stringTypeNode('utf8'), 32),
    publicKeyTypeNode(),
    prefixedCountNode(numberTypeNode('u8')),
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
|   |   numberTypeNode [u8]
|   fixedSizeTypeNode [32]
|   |   stringTypeNode [utf8]
|   publicKeyTypeNode`,
    );
});
