import {
    accountNode,
    numberTypeNode,
    pdaLinkNode,
    publicKeyTypeNode,
    sizeDiscriminatorNode,
    structFieldTypeNode,
    structTypeNode,
} from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from './_setup.js';

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

test(mergeVisitorMacro, node, 10);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[accountNode]', null);
test(deleteNodesVisitorMacro, node, '[pdaLinkNode]', accountNode({ ...node, pda: undefined }));
test(
    getDebugStringVisitorMacro,
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
