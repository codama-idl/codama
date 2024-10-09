import {
    accountValueNode,
    constantPdaSeedNode,
    pdaLinkNode,
    pdaNode,
    pdaSeedValueNode,
    pdaValueNode,
    publicKeyTypeNode,
    publicKeyValueNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = pdaValueNode(pdaLinkNode('associatedToken'), [
    pdaSeedValueNode('mint', accountValueNode('mint')),
    pdaSeedValueNode('owner', publicKeyValueNode('8sphVBHQxufE4Jc1HMuWwWdKgoDjncQyPHwxYhfATRtF')),
]);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 6);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('identityVisitor with inlined PdaNode', () => {
    const inlinedPdaNode = pdaNode({
        name: 'associatedToken',
        seeds: [
            variablePdaSeedNode('mint', publicKeyTypeNode()),
            constantPdaSeedNode(
                publicKeyTypeNode(),
                publicKeyValueNode('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
            ),
            variablePdaSeedNode('owner', publicKeyTypeNode()),
        ],
    });
    const inlinedPdaValueNode = pdaValueNode(inlinedPdaNode, [
        pdaSeedValueNode('mint', accountValueNode('mint')),
        pdaSeedValueNode('owner', publicKeyValueNode('8sphVBHQxufE4Jc1HMuWwWdKgoDjncQyPHwxYhfATRtF')),
    ]);
    expectIdentityVisitor(inlinedPdaValueNode);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[pdaValueNode]', null);
    expectDeleteNodesVisitor(node, '[pdaLinkNode]', null);
    expectDeleteNodesVisitor(node, '[pdaSeedValueNode]', { ...node, seeds: [] });
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
pdaValueNode
|   pdaLinkNode [associatedToken]
|   pdaSeedValueNode [mint]
|   |   accountValueNode [mint]
|   pdaSeedValueNode [owner]
|   |   publicKeyValueNode [8sphVBHQxufE4Jc1HMuWwWdKgoDjncQyPHwxYhfATRtF]`,
    );
});
