import {
    constantPdaSeedNode,
    numberTypeNode,
    numberValueNode,
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
    name: 'associatedToken',
    seeds: [
        variablePdaSeedNode('owner', publicKeyTypeNode()),
        constantPdaSeedNode(numberTypeNode('u8'), numberValueNode(123456)),
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
    expectDeleteNodesVisitor(node, ['[variablePdaSeedNode]', '[constantPdaSeedNode]'], { ...node, seeds: [] });
    expectDeleteNodesVisitor(node, '[publicKeyTypeNode]', {
        ...node,
        seeds: [constantPdaSeedNode(numberTypeNode('u8'), numberValueNode(123456))],
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
|   |   numberTypeNode [u8]
|   |   numberValueNode [123456]
|   variablePdaSeedNode [mint]
|   |   publicKeyTypeNode`,
    );
});
