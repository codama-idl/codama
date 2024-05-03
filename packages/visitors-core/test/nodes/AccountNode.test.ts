import {
    accountNode,
    numberTypeNode,
    pdaLinkNode,
    publicKeyTypeNode,
    sizeDiscriminatorNode,
    structFieldTypeNode,
    structTypeNode,
} from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from './_setup';

const node = accountNode({
    data: structTypeNode([
        structFieldTypeNode({ name: 'mint', type: publicKeyTypeNode() }),
        structFieldTypeNode({ name: 'owner', type: publicKeyTypeNode() }),
        structFieldTypeNode({ name: 'amount', type: numberTypeNode('u64') }),
    ]),
    discriminators: [sizeDiscriminatorNode(72)],
    name: 'token',
    pda: pdaLinkNode('associatedToken'),
    size: 72,
});

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 10);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[accountNode]', null);
    expectDeleteNodesVisitor(node, '[pdaLinkNode]', accountNode({ ...node, pda: undefined }));
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
accountNode [token]
|   structTypeNode
|   |   structFieldTypeNode [mint]
|   |   |   publicKeyTypeNode
|   |   structFieldTypeNode [owner]
|   |   |   publicKeyTypeNode
|   |   structFieldTypeNode [amount]
|   |   |   numberTypeNode [u64]
|   pdaLinkNode [associatedToken]
|   sizeDiscriminatorNode [72]`,
    );
});
