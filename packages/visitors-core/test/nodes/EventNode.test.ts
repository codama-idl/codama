import {
    eventNode,
    numberTypeNode,
    pdaLinkNode,
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
        structFieldTypeNode({ name: 'authority', type: publicKeyTypeNode() }),
        structFieldTypeNode({ name: 'amount', type: numberTypeNode('u64') }),
    ]),
    discriminators: [sizeDiscriminatorNode(40)],
    name: 'transferEvent',
    pda: pdaLinkNode('eventAuthority'),
    size: 40,
});

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 8);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[eventNode]', null);
    expectDeleteNodesVisitor(node, '[pdaLinkNode]', eventNode({ ...node, pda: undefined }));
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
|   |   |   numberTypeNode [u64]
|   pdaLinkNode [eventAuthority]
|   sizeDiscriminatorNode [40]`,
    );
});
