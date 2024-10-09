import { enumEmptyVariantTypeNode, enumTupleVariantTypeNode, numberTypeNode, tupleTypeNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = enumTupleVariantTypeNode('coordinates', tupleTypeNode([numberTypeNode('u32'), numberTypeNode('u32')]));

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 4);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[enumTupleVariantTypeNode]', null);
    expectDeleteNodesVisitor(node, '[tupleTypeNode]', enumEmptyVariantTypeNode('coordinates'));
    expectDeleteNodesVisitor(node, '[numberTypeNode]', enumEmptyVariantTypeNode('coordinates'));
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
enumTupleVariantTypeNode [coordinates]
|   tupleTypeNode
|   |   numberTypeNode [u32]
|   |   numberTypeNode [u32]`,
    );
});
