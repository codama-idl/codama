import {
    eventNode,
    integerTypeNode,
    publicKeyTypeNode,
    sizeDiscriminatorNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from './_setup';

const node = eventNode({
    data: structTypeNode([
        structFieldTypeNode({ identifier: 'authority', type: publicKeyTypeNode() }),
        structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') }),
    ]),
    discriminators: [sizeDiscriminatorNode(40)],
    identifier: 'transferEvent',
});

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 7);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[eventNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
eventNode [transferEvent]
|   structTypeNode
|   |   structFieldTypeNode [authority]
|   |   |   publicKeyTypeNode
|   |   structFieldTypeNode [amount]
|   |   |   integerTypeNode [u64]
|   sizeDiscriminatorNode [40]`,
    );
});
