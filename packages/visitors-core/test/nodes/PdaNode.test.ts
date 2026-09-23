import {
    constantPdaSeedNode,
    integerTypeNode,
    integerValueNode,
    pdaNode,
    publicKeyTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from './_setup';

const node = pdaNode({
    identifier: 'associatedToken',
    seeds: [
        variablePdaSeedNode('owner', publicKeyTypeNode()),
        constantPdaSeedNode(integerTypeNode('u8'), integerValueNode('123456')),
        variablePdaSeedNode('mint', publicKeyTypeNode()),
    ],
});

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 8);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[pdaNode]', null);
    expectDeleteNodesVisitor(node, ['[variablePdaSeedNode]', '[constantPdaSeedNode]'], { ...node, seeds: undefined });
    expectDeleteNodesVisitor(node, '[publicKeyTypeNode]', {
        ...node,
        seeds: [constantPdaSeedNode(integerTypeNode('u8'), integerValueNode('123456'))],
    });
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
pdaNode [associatedToken]
|   variablePdaSeedNode [owner]
|   |   publicKeyTypeNode
|   constantPdaSeedNode
|   |   integerTypeNode [u8]
|   |   integerValueNode [123456]
|   variablePdaSeedNode [mint]
|   |   publicKeyTypeNode`,
    );
});
