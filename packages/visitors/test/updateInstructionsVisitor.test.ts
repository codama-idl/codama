import {
    ArgumentValueNode,
    argumentValueNode,
    assertIsNode,
    CamelCaseString,
    ConstantDiscriminatorNode,
    constantDiscriminatorNode,
    constantValueNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionByteDeltaNode,
    instructionNode,
    instructionRemainingAccountsNode,
    numberTypeNode,
    NumberValueNode,
    numberValueNode,
    programNode,
    rootNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { updateInstructionsVisitor } from '../src';

test('it updates the name of an instruction', () => {
    // Given the following program node with one instruction.
    const node = programNode({
        instructions: [instructionNode({ name: 'myInstruction' })],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we update the name of that instruction.
    const result = visit(
        node,
        updateInstructionsVisitor({
            myInstruction: { name: 'myNewInstruction' },
        }),
    );

    // Then we expect the following tree changes.
    assertIsNode(result, 'programNode');
    expect(result.instructions[0].name).toBe('myNewInstruction' as CamelCaseString);
});

test('it updates the name of an instruction within a specific program', () => {
    // Given two programs each with an instruction of the same name.
    const node = rootNode(
        programNode({
            instructions: [instructionNode({ name: 'transfer' })],
            name: 'myProgramA',
            publicKey: '1111',
        }),
        [
            programNode({
                instructions: [instructionNode({ name: 'transfer' })],
                name: 'myProgramB',
                publicKey: '2222',
            }),
        ],
    );

    // When we update the name of that instruction in the first program.
    const result = visit(
        node,
        updateInstructionsVisitor({
            'myProgramA.transfer': { name: 'newTransfer' },
        }),
    );

    // Then we expect the first instruction to have been renamed.
    assertIsNode(result, 'rootNode');
    expect(result.program.instructions[0].name).toBe('newTransfer' as CamelCaseString);

    // But not the second instruction.
    expect(result.additionalPrograms[0].instructions[0].name).toBe('transfer' as CamelCaseString);
});

test('it updates the name of an instruction account', () => {
    // Given the following instruction node with one account.
    const node = instructionNode({
        accounts: [
            instructionAccountNode({
                isSigner: false,
                isWritable: true,
                name: 'myAccount',
            }),
        ],
        name: 'myInstruction',
    });

    // When we update the name of that instruction account.
    const result = visit(
        node,
        updateInstructionsVisitor({
            myInstruction: {
                accounts: {
                    myAccount: { name: 'myNewAccount' },
                },
            },
        }),
    );

    // Then we expect the following tree changes.
    assertIsNode(result, 'instructionNode');
    expect(result.accounts[0].name).toBe('myNewAccount' as CamelCaseString);
});

test('it updates the name of an instruction argument', () => {
    // Given the following instruction node with one argument.
    const node = instructionNode({
        arguments: [
            instructionArgumentNode({
                name: 'myArgument',
                type: numberTypeNode('u8'),
            }),
        ],
        name: 'myInstruction',
    });

    // When we update the name of that instruction argument.
    const result = visit(
        node,
        updateInstructionsVisitor({
            myInstruction: {
                arguments: {
                    myArgument: { name: 'myNewArgument' },
                },
            },
        }),
    );

    // Then we expect the following tree changes.
    assertIsNode(result, 'instructionNode');
    expect(result.arguments[0].name).toBe('myNewArgument' as CamelCaseString);
});

test('it updates the default value of an instruction argument', () => {
    // Given the following instruction node with a argument that has no default value.
    const node = instructionNode({
        arguments: [
            instructionArgumentNode({
                name: 'amount',
                type: numberTypeNode('u64'),
            }),
        ],
        name: 'transferTokens',
    });

    // When we update the default value of that instruction argument.
    const result = visit(
        node,
        updateInstructionsVisitor({
            transferTokens: {
                arguments: {
                    amount: { defaultValue: numberValueNode(1) },
                },
            },
        }),
    );

    // Then we expect the following tree changes.
    assertIsNode(result, 'instructionNode');
    expect(result.arguments[0].defaultValue).toEqual(numberValueNode(1));
    expect(result.arguments[0].defaultValueStrategy).toBeUndefined();
});

test('it updates the default value strategy of an instruction argument', () => {
    // Given the following instruction node with two arguments that have no default values.
    const node = instructionNode({
        arguments: [
            instructionArgumentNode({
                name: 'discriminator',
                type: numberTypeNode('u8'),
            }),
            instructionArgumentNode({
                name: 'amount',
                type: numberTypeNode('u64'),
            }),
        ],
        name: 'transferTokens',
    });

    // When we update the default value of these arguments using specific strategies.
    const result = visit(
        node,
        updateInstructionsVisitor({
            transferTokens: {
                arguments: {
                    amount: {
                        defaultValue: numberValueNode(1),
                        defaultValueStrategy: 'optional',
                    },
                    discriminator: {
                        defaultValue: numberValueNode(42),
                        defaultValueStrategy: 'omitted',
                    },
                },
            },
        }),
    );

    // Then we expect the following tree changes.
    assertIsNode(result, 'instructionNode');
    expect(result.arguments[0].defaultValue).toEqual(numberValueNode(42));
    expect(result.arguments[0].defaultValueStrategy).toBe('omitted');
    expect(result.arguments[1].defaultValue).toEqual(numberValueNode(1));
    expect(result.arguments[1].defaultValueStrategy).toBe('optional');
});

test('it updates the byteDeltas of an instruction', () => {
    // Given the following instruction node with no byteDeltas.
    const node = instructionNode({
        name: 'myInstruction',
    });

    // When we update the byteDeltas of that instruction.
    const result = visit(
        node,
        updateInstructionsVisitor({
            myInstruction: {
                byteDeltas: [instructionByteDeltaNode(numberValueNode(100))],
            },
        }),
    );

    // Then we expect the following tree changes.
    assertIsNode(result, 'instructionNode');
    expect(result.byteDeltas).toEqual([instructionByteDeltaNode(numberValueNode(100))]);
});

test('it updates the discriminators of an instruction', () => {
    // Given the following instruction node with no discriminators.
    const node = instructionNode({
        name: 'myInstruction',
    });

    // When we update the discriminators of that instruction.
    const result = visit(
        node,
        updateInstructionsVisitor({
            myInstruction: {
                discriminators: [
                    constantDiscriminatorNode(constantValueNode(numberTypeNode('u64'), numberValueNode(42))),
                ],
            },
        }),
    );

    // Then we expect the following tree changes.
    assertIsNode(result, 'instructionNode');
    expect(result.discriminators![0].kind).toBe('constantDiscriminatorNode');
    expect(((result.discriminators![0] as ConstantDiscriminatorNode).constant.value as NumberValueNode).number).toEqual(
        42,
    );
});

test('it updates the remainingAccounts of an instruction', () => {
    // Given the following instruction node with no remaining accounts.
    const node = instructionNode({
        name: 'myInstruction',
    });

    // When we update the remaining accounts of that instruction.
    const result = visit(
        node,
        updateInstructionsVisitor({
            myInstruction: {
                remainingAccounts: [instructionRemainingAccountsNode(argumentValueNode('abc'))],
            },
        }),
    );

    // Then we expect the following tree changes.
    assertIsNode(result, 'instructionNode');
    expect(result.remainingAccounts![0].kind).toBe('instructionRemainingAccountsNode');
    expect((result.remainingAccounts![0].value as ArgumentValueNode).name).toBe('abc');
});
