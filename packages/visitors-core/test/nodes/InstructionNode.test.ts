import {
    fieldDiscriminatorNode,
    instructionAccountNode,
    instructionByteDeltaNode,
    instructionNode,
    instructionRemainingAccountsNode,
    instructionStatusNode,
    integerTypeNode,
    integerValueNode,
    structFieldTypeNode,
    structTypeNode,
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
            identifier: 'source',
            isSigner: true,
            isWritable: true,
        }),
        instructionAccountNode({
            identifier: 'destination',
            isSigner: false,
            isWritable: true,
        }),
    ],
    data: structTypeNode([
        structFieldTypeNode({
            identifier: 'discriminator',
            type: integerTypeNode('u32'),
        }),
        structFieldTypeNode({
            identifier: 'amount',
            type: integerTypeNode('u64'),
        }),
    ]),
    discriminators: [fieldDiscriminatorNode('discriminator')],
    identifier: 'transferSol',
});

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 9);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[instructionNode]', null);
    expectDeleteNodesVisitor(node, '[instructionAccountNode]', { ...node, accounts: undefined });
    expectDeleteNodesVisitor(node, '[structTypeNode]', { ...node, data: undefined });
    expectDeleteNodesVisitor(node, '[fieldDiscriminatorNode]', { ...node, discriminators: undefined });
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
instructionNode [transferSol]
|   instructionAccountNode [source.writable.signer]
|   instructionAccountNode [destination.writable]
|   structTypeNode
|   |   structFieldTypeNode [discriminator]
|   |   |   integerTypeNode [u32]
|   |   structFieldTypeNode [amount]
|   |   |   integerTypeNode [u64]
|   fieldDiscriminatorNode [discriminator]`,
    );
});

test('remaining accounts', () => {
    const nodeWithRemainingAccounts = instructionNode({
        identifier: 'myInstruction',
        remainingAccounts: [
            instructionRemainingAccountsNode('remainingAccounts', { isSigner: 'either', isWritable: true }),
        ],
    });

    expectMergeVisitorCount(nodeWithRemainingAccounts, 2);
    expectIdentityVisitor(nodeWithRemainingAccounts);
});

test('byte deltas', () => {
    const nodeWithByteDeltas = instructionNode({
        byteDeltas: [instructionByteDeltaNode(integerValueNode('42'))],
        identifier: 'myInstruction',
    });

    expectMergeVisitorCount(nodeWithByteDeltas, 3);
    expectIdentityVisitor(nodeWithByteDeltas);
});

test('sub instructions', () => {
    const nodeWithSubInstructions = instructionNode({
        identifier: 'myInstruction',
        subInstructions: [
            instructionNode({ identifier: 'mySubInstruction1' }),
            instructionNode({ identifier: 'mySubInstruction2' }),
        ],
    });

    expectMergeVisitorCount(nodeWithSubInstructions, 3);
    expectIdentityVisitor(nodeWithSubInstructions);
});

test('status mode', () => {
    const nodeWithStatus = instructionNode({
        identifier: 'deprecatedInstruction',
        status: instructionStatusNode('deprecated', { message: 'Use newInstruction instead' }),
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
