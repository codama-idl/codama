import {
    fieldDiscriminatorNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionByteDeltaNode,
    instructionNode,
    instructionRemainingAccountsNode,
    instructionStatus,
    numberTypeNode,
    numberValueNode,
    publicKeyTypeNode,
    resolverValueNode,
} from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from './_setup';

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

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 8);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[instructionNode]', null);
    expectDeleteNodesVisitor(node, '[instructionAccountNode]', { ...node, accounts: [] });
    expectDeleteNodesVisitor(node, '[instructionArgumentNode]', { ...node, arguments: [] });
    expectDeleteNodesVisitor(node, '[fieldDiscriminatorNode]', { ...node, discriminators: [] });
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
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
});

test('extra arguments', () => {
    const nodeWithExtraArguments = instructionNode({
        extraArguments: [
            instructionArgumentNode({
                name: 'myExtraArgument',
                type: publicKeyTypeNode(),
            }),
        ],
        name: 'myInstruction',
    });

    expectMergeVisitorCount(nodeWithExtraArguments, 3);
    expectIdentityVisitor(nodeWithExtraArguments);
});

test('remaining accounts', () => {
    const nodeWithRemainingAccounts = instructionNode({
        name: 'myInstruction',
        remainingAccounts: [instructionRemainingAccountsNode(resolverValueNode('myResolver'))],
    });

    expectMergeVisitorCount(nodeWithRemainingAccounts, 3);
    expectIdentityVisitor(nodeWithRemainingAccounts);
});

test('byte deltas', () => {
    const nodeWithByteDeltas = instructionNode({
        byteDeltas: [instructionByteDeltaNode(numberValueNode(42))],
        name: 'myInstruction',
    });

    expectMergeVisitorCount(nodeWithByteDeltas, 3);
    expectIdentityVisitor(nodeWithByteDeltas);
});

test('sub instructions', () => {
    const nodeWithSubInstructions = instructionNode({
        name: 'myInstruction',
        subInstructions: [
            instructionNode({ name: 'mySubInstruction1' }),
            instructionNode({ name: 'mySubInstruction2' }),
        ],
    });

    expectMergeVisitorCount(nodeWithSubInstructions, 3);
    expectIdentityVisitor(nodeWithSubInstructions);
});

test('status mode', () => {
    const nodeWithStatus = instructionNode({
        name: 'deprecatedInstruction',
        status: instructionStatus('deprecated', { message: 'Use newInstruction instead' }),
    });

    expectMergeVisitorCount(nodeWithStatus, 2);
    expectIdentityVisitor(nodeWithStatus);
    expectDebugStringVisitor(
        nodeWithStatus,
        `
instructionNode [deprecatedInstruction]
|   instructionStatusNode [deprecated.Use newInstruction instead]`,
    );
});
