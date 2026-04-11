import {
    accountNode,
    definedTypeNode,
    enumTypeNode,
    errorNode,
    eventNode,
    instructionNode,
    pdaNode,
    type ProgramNode,
    programNode,
    structTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { identityVisitor, mergeVisitor, visit } from '../../src';
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
    events: [eventNode({ data: structTypeNode([]), name: 'transferEvent' })],
    instructions: [instructionNode({ name: 'mintTokens' }), instructionNode({ name: 'transferTokens' })],
    name: 'splToken',
    pdas: [pdaNode({ name: 'associatedToken', seeds: [] })],
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
    expectDeleteNodesVisitor(node, '[pdaNode]', { ...node, pdas: [] });
    expectDeleteNodesVisitor(node, '[accountNode]', { ...node, accounts: [] });
    expectDeleteNodesVisitor(node, '[eventNode]', { ...node, events: [] });
    expectDeleteNodesVisitor(node, '[instructionNode]', { ...node, instructions: [] });
    expectDeleteNodesVisitor(node, '[definedTypeNode]', { ...node, definedTypes: [] });
    expectDeleteNodesVisitor(node, '[errorNode]', { ...node, errors: [] });
});

test('mergeVisitor handles ProgramNode with missing events field', () => {
    const raw = { ...programNode({ name: 'foo', publicKey: '1111' }), events: undefined } as unknown as ProgramNode;
    const visitor = mergeVisitor(
        () => 1,
        (_, values) => values.reduce((a, b) => a + b, 1),
    );
    expect(() => visit(raw, visitor)).not.toThrow();
});

test('identityVisitor handles ProgramNode with missing events field', () => {
    const raw = { ...programNode({ name: 'foo', publicKey: '1111' }), events: undefined } as unknown as ProgramNode;
    const result = visit(raw, identityVisitor());
    expect(result).not.toBeNull();
    expect((result as ProgramNode).events).toEqual([]);
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
|   |   |   numberTypeNode [u8]
|   errorNode [1.invalidMint]
|   errorNode [2.invalidToken]`,
    );
});
