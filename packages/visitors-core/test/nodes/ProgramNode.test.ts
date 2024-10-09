import {
    accountNode,
    definedTypeNode,
    enumTypeNode,
    errorNode,
    instructionNode,
    pdaNode,
    programNode,
    structTypeNode,
} from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from './_setup';

const node = programNode({
    accounts: [
        accountNode({ data: structTypeNode([]), name: 'mint' }),
        accountNode({ data: structTypeNode([]), name: 'token' }),
    ],
    definedTypes: [definedTypeNode({ name: 'tokenState', type: enumTypeNode([]) })],
    errors: [
        errorNode({ code: 1, message: 'Invalid mint', name: 'invalidMint' }),
        errorNode({ code: 2, message: 'Invalid token', name: 'invalidToken' }),
    ],
    instructions: [instructionNode({ name: 'mintTokens' }), instructionNode({ name: 'transferTokens' })],
    name: 'splToken',
    pdas: [pdaNode({ name: 'associatedToken', seeds: [] })],
    publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    version: '1.2.3',
});

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 13);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[programNode]', null);
    expectDeleteNodesVisitor(node, '[pdaNode]', { ...node, pdas: [] });
    expectDeleteNodesVisitor(node, '[accountNode]', { ...node, accounts: [] });
    expectDeleteNodesVisitor(node, '[instructionNode]', { ...node, instructions: [] });
    expectDeleteNodesVisitor(node, '[definedTypeNode]', { ...node, definedTypes: [] });
    expectDeleteNodesVisitor(node, '[errorNode]', { ...node, errors: [] });
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
programNode [splToken.TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA]
|   pdaNode [associatedToken]
|   accountNode [mint]
|   |   structTypeNode
|   accountNode [token]
|   |   structTypeNode
|   instructionNode [mintTokens]
|   instructionNode [transferTokens]
|   definedTypeNode [tokenState]
|   |   enumTypeNode
|   |   |   numberTypeNode [u8]
|   errorNode [1.invalidMint]
|   errorNode [2.invalidToken]`,
    );
});
