import {
    addTypeNodeTransforms,
    enumTypeNode,
    enumVariantTypeNode,
    fixedSizeTransformNode,
    integerTypeNode,
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
        enumVariantTypeNode('quit'),
        enumVariantTypeNode('write', {
            data: tupleTypeNode([addTypeNodeTransforms(stringTypeNode('utf8'), [fixedSizeTransformNode(32)])]),
        }),
        enumVariantTypeNode('move', {
            data: structTypeNode([
                structFieldTypeNode({ identifier: 'x', type: integerTypeNode('u32') }),
                structFieldTypeNode({ identifier: 'y', type: integerTypeNode('u32') }),
            ]),
        }),
    ],
    { size: integerTypeNode('u64') },
);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 13);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[enumTypeNode]', null);
    expectDeleteNodesVisitor(node, '[enumVariantTypeNode]', { ...node, variants: undefined });
    expectDeleteNodesVisitor(node, ['[tupleTypeNode]', '[structFieldTypeNode]'], {
        ...node,
        variants: [
            enumVariantTypeNode('quit'),
            enumVariantTypeNode('write'),
            enumVariantTypeNode('move', { data: structTypeNode([]) }),
        ],
    });
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
enumTypeNode
|   integerTypeNode [u64]
|   enumVariantTypeNode [quit]
|   enumVariantTypeNode [write]
|   |   tupleTypeNode
|   |   |   stringTypeNode [utf8]
|   |   |   |   fixedSizeTransformNode [32]
|   enumVariantTypeNode [move]
|   |   structTypeNode
|   |   |   structFieldTypeNode [x]
|   |   |   |   integerTypeNode [u32]
|   |   |   structFieldTypeNode [y]
|   |   |   |   integerTypeNode [u32]`,
    );
});
