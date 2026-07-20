import {
    camelCase,
    type ConditionalValueNode,
    identityValueNode,
    type InstructionAccountNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
    programNode,
    rootNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { resolveConditionalValueNodeCondition } from '../../src/resolvers/resolve-conditional';

const sourceAccount = instructionAccountNode({
    isSigner: false,
    isWritable: true,
    name: 'source',
});
const transferIx = instructionNode({
    accounts: [
        sourceAccount,
        instructionAccountNode({
            isSigner: false,
            isWritable: true,
            name: 'destination',
        }),
        instructionAccountNode({
            defaultValue: identityValueNode(),
            isSigner: 'either',
            isWritable: false,
            name: 'authority',
        }),
    ],
    arguments: [
        instructionArgumentNode({
            name: 'amount',
            type: numberTypeNode('u64'),
        }),
    ],
    name: 'transfer',
});
const tokenRoot = rootNode(
    programNode({
        instructions: [transferIx],
        name: 'splToken',
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    }),
);

describe('resolveConditionalValueNodeCondition: INVARIANT_VIOLATION', () => {
    test('should throw when conditionalValueNode has no value and no branches', async () => {
        const ixAccountNode: InstructionAccountNode = sourceAccount;

        const invalidConditional: ConditionalValueNode = {
            condition: { kind: 'accountValueNode', name: camelCase('source') },
            kind: 'conditionalValueNode',
        };

        await expect(
            resolveConditionalValueNodeCondition({
                accountsInput: {},
                argumentsInput: {},
                conditionalValueNode: invalidConditional,
                ixAccountNode,
                ixNode: transferIx,
                resolutionPath: [],
                resolversInput: {},
                root: tokenRoot,
            }),
        ).rejects.toThrow(
            'Internal invariant violation: [Invalid conditionalValueNode: missing value and branches for account source in transfer].',
        );
    });
});
