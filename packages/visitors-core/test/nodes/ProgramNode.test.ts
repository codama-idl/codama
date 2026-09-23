import {
    accountNode,
    definedTypeNode,
    enumTypeNode,
    errorNode,
    eventNode,
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
        accountNode({ data: structTypeNode([]), identifier: 'mint' }),
        accountNode({ data: structTypeNode([]), identifier: 'token' }),
    ],
    definedTypes: [definedTypeNode({ identifier: 'tokenState', type: enumTypeNode([]) })],
    errors: [
        errorNode({ code: 1, identifier: 'invalidMint', message: 'Invalid mint' }),
        errorNode({ code: 2, identifier: 'invalidToken', message: 'Invalid token' }),
    ],
    events: [eventNode({ data: structTypeNode([]), identifier: 'transferEvent' })],
    identifier: 'splToken',
    instructions: [instructionNode({ identifier: 'mintTokens' }), instructionNode({ identifier: 'transferTokens' })],
    pdas: [pdaNode({ identifier: 'associatedToken', seeds: [] })],
    publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    version: '1.2.3',
});

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 15);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[programNode]', null);
    expectDeleteNodesVisitor(node, '[pdaNode]', { ...node, pdas: undefined });
    expectDeleteNodesVisitor(node, '[accountNode]', { ...node, accounts: undefined });
    expectDeleteNodesVisitor(node, '[eventNode]', { ...node, events: undefined });
    expectDeleteNodesVisitor(node, '[instructionNode]', { ...node, instructions: undefined });
    expectDeleteNodesVisitor(node, '[definedTypeNode]', { ...node, definedTypes: undefined });
    expectDeleteNodesVisitor(node, '[errorNode]', { ...node, errors: undefined });
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
|   eventNode [transferEvent]
|   |   structTypeNode
|   instructionNode [mintTokens]
|   instructionNode [transferTokens]
|   definedTypeNode [tokenState]
|   |   enumTypeNode
|   |   |   integerTypeNode [u8]
|   errorNode [1.invalidMint]
|   errorNode [2.invalidToken]`,
    );
});
