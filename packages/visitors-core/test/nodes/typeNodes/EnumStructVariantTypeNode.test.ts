import {
    enumEmptyVariantTypeNode,
    enumStructVariantTypeNode,
    numberTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = enumStructVariantTypeNode(
    'mouseClick',
    structTypeNode([
        structFieldTypeNode({ name: 'x', type: numberTypeNode('u32') }),
        structFieldTypeNode({ name: 'y', type: numberTypeNode('u32') }),
    ]),
);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 6);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[enumStructVariantTypeNode]', null);
    expectDeleteNodesVisitor(node, '[structTypeNode]', enumEmptyVariantTypeNode('mouseClick'));
    expectDeleteNodesVisitor(node, '[structFieldTypeNode]', enumEmptyVariantTypeNode('mouseClick'));
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
enumStructVariantTypeNode [mouseClick]
|   structTypeNode
|   |   structFieldTypeNode [x]
|   |   |   numberTypeNode [u32]
|   |   structFieldTypeNode [y]
|   |   |   numberTypeNode [u32]`,
    );
});
