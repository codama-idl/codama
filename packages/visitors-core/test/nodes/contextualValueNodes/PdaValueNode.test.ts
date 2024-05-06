import { accountValueNode, pdaLinkNode, pdaSeedValueNode, pdaValueNode, publicKeyValueNode } from '@kinobi-so/nodes';
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
