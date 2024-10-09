import { programNode, rootNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from './_setup';

const node = rootNode(
    programNode({
        name: 'splToken',
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    }),
    [
        programNode({
            name: 'splAddressLookupTable',
            publicKey: 'AddressLookupTab1e1111111111111111111111111',
        }),
    ],
);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 3);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[rootNode]', null);
    expectDeleteNodesVisitor(node, '[programNode]', null);
    expectDeleteNodesVisitor(node, '[programNode]splAddressLookupTable', { ...node, additionalPrograms: [] });
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
rootNode
|   programNode [splToken.TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA]
|   programNode [splAddressLookupTable.AddressLookupTab1e1111111111111111111111111]`,
    );
});
