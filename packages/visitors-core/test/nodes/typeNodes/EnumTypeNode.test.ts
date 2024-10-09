import {
    enumEmptyVariantTypeNode,
    enumStructVariantTypeNode,
    enumTupleVariantTypeNode,
    enumTypeNode,
    fixedSizeTypeNode,
    numberTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = enumTypeNode(
    [
        enumEmptyVariantTypeNode('quit'),
        enumTupleVariantTypeNode('write', tupleTypeNode([fixedSizeTypeNode(stringTypeNode('utf8'), 32)])),
        enumStructVariantTypeNode(
            'move',
            structTypeNode([
                structFieldTypeNode({ name: 'x', type: numberTypeNode('u32') }),
                structFieldTypeNode({ name: 'y', type: numberTypeNode('u32') }),
            ]),
        ),
    ],
    { size: numberTypeNode('u64') },
);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 13);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[enumTypeNode]', null);
    expectDeleteNodesVisitor(
        node,
        ['[enumEmptyVariantTypeNode]', '[enumTupleVariantTypeNode]', '[enumStructVariantTypeNode]'],
        { ...node, variants: [] },
    );
    expectDeleteNodesVisitor(node, ['[tupleTypeNode]', '[structFieldTypeNode]'], {
        ...node,
        variants: [
            enumEmptyVariantTypeNode('quit'),
            enumEmptyVariantTypeNode('write'),
            enumEmptyVariantTypeNode('move'),
        ],
    });
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
enumTypeNode
|   numberTypeNode [u64]
|   enumEmptyVariantTypeNode [quit]
|   enumTupleVariantTypeNode [write]
|   |   tupleTypeNode
|   |   |   fixedSizeTypeNode [32]
|   |   |   |   stringTypeNode [utf8]
|   enumStructVariantTypeNode [move]
|   |   structTypeNode
|   |   |   structFieldTypeNode [x]
|   |   |   |   numberTypeNode [u32]
|   |   |   structFieldTypeNode [y]
|   |   |   |   numberTypeNode [u32]`,
    );
});
