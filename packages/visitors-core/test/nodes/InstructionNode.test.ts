import {
    fieldDiscriminatorNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionByteDeltaNode,
    instructionNode,
    instructionRemainingAccountsNode,
    numberTypeNode,
    numberValueNode,
    publicKeyTypeNode,
    resolverValueNode,
} from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from './_setup.js';

const node = instructionNode({
    accounts: [
        instructionAccountNode({
            isSigner: true,
            isWritable: true,
            name: 'source',
        }),
        instructionAccountNode({
            isSigner: false,
            isWritable: true,
            name: 'destination',
        }),
    ],
    arguments: [
        instructionArgumentNode({
            name: 'discriminator',
            type: numberTypeNode('u32'),
        }),
        instructionArgumentNode({
            name: 'amount',
            type: numberTypeNode('u64'),
        }),
    ],
    discriminators: [fieldDiscriminatorNode('discriminator')],
    name: 'transferSol',
});

test(mergeVisitorMacro, node, 8);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[instructionNode]', null);
test(deleteNodesVisitorMacro, node, '[instructionAccountNode]', {
    ...node,
    accounts: [],
});
test(deleteNodesVisitorMacro, node, '[instructionArgumentNode]', {
    ...node,
    arguments: [],
});
test(deleteNodesVisitorMacro, node, '[fieldDiscriminatorNode]', {
    ...node,
    discriminators: [],
});
test(
    getDebugStringVisitorMacro,
    node,
    `
instructionNode [transferSol]
|   instructionAccountNode [source.writable.signer]
|   instructionAccountNode [destination.writable]
|   instructionArgumentNode [discriminator]
|   |   numberTypeNode [u32]
|   instructionArgumentNode [amount]
|   |   numberTypeNode [u64]
|   fieldDiscriminatorNode [discriminator]`,
);

// Extra arguments.
const nodeWithExtraArguments = instructionNode({
    extraArguments: [
        instructionArgumentNode({
            name: 'myExtraArgument',
            type: publicKeyTypeNode(),
        }),
    ],
    name: 'myInstruction',
});
test('mergeVisitor: extraArguments', mergeVisitorMacro, nodeWithExtraArguments, 3);
test('identityVisitor: extraArguments', identityVisitorMacro, nodeWithExtraArguments);

// Remaining accounts.
const nodeWithRemainingAccounts = instructionNode({
    name: 'myInstruction',
    remainingAccounts: [instructionRemainingAccountsNode(resolverValueNode('myResolver'))],
});
test('mergeVisitor: remainingAccounts', mergeVisitorMacro, nodeWithRemainingAccounts, 3);
test('identityVisitor: remainingAccounts', identityVisitorMacro, nodeWithRemainingAccounts);

// Byte deltas.
const nodeWithByteDeltas = instructionNode({
    byteDeltas: [instructionByteDeltaNode(numberValueNode(42))],
    name: 'myInstruction',
});
test('mergeVisitor: byteDeltas', mergeVisitorMacro, nodeWithByteDeltas, 3);
test('identityVisitor: byteDeltas', identityVisitorMacro, nodeWithByteDeltas);

// Sub-instructions.
const nodeWithSubInstructions = instructionNode({
    name: 'myInstruction',
    subInstructions: [instructionNode({ name: 'mySubInstruction1' }), instructionNode({ name: 'mySubInstruction2' })],
});
test('mergeVisitor: subInstructions', mergeVisitorMacro, nodeWithSubInstructions, 3);
test('identityVisitor: subInstructions', identityVisitorMacro, nodeWithSubInstructions);
