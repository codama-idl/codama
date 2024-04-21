import {
    accountNode,
    definedTypeNode,
    enumTypeNode,
    errorNode,
    instructionNode,
    pdaNode,
    programNode,
    structTypeNode,
} from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from './_setup.js';

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

test(mergeVisitorMacro, node, 13);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[programNode]', null);
test(deleteNodesVisitorMacro, node, '[pdaNode]', { ...node, pdas: [] });
test(deleteNodesVisitorMacro, node, '[accountNode]', { ...node, accounts: [] });
test(deleteNodesVisitorMacro, node, '[instructionNode]', {
    ...node,
    instructions: [],
});
test(deleteNodesVisitorMacro, node, '[definedTypeNode]', {
    ...node,
    definedTypes: [],
});
test(deleteNodesVisitorMacro, node, '[errorNode]', { ...node, errors: [] });
test(
    getDebugStringVisitorMacro,
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
