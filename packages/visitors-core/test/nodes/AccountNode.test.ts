import {
    accountNode,
    integerTypeNode,
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

const node = accountNode({
    data: structTypeNode([
        structFieldTypeNode({ identifier: 'mint', type: publicKeyTypeNode() }),
        structFieldTypeNode({ identifier: 'owner', type: publicKeyTypeNode() }),
        structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') }),
    ]),
    discriminators: [sizeDiscriminatorNode(72)],
    identifier: 'token',
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
|   |   |   integerTypeNode [u64]
|   pdaLinkNode [associatedToken]
|   sizeDiscriminatorNode [72]`,
    );
});
