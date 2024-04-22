import {
    assertIsNode,
    CamelCaseString,
    instructionAccountNode,
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
    numberValueNode,
    programNode,
    rootNode,
} from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import test from 'ava';

import { updateInstructionsVisitor } from '../src/index.js';

test('it updates the name of an instruction', t => {
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
    t.is(result.instructions[0].name, 'myNewInstruction' as CamelCaseString);
});

test('it updates the name of an instruction within a specific program', t => {
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
    t.is(result.program.instructions[0].name, 'newTransfer' as CamelCaseString);

    // But not the second instruction.
    t.is(result.additionalPrograms[0].instructions[0].name, 'transfer' as CamelCaseString);
});

test('it updates the name of an instruction account', t => {
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
    t.is(result.accounts[0].name, 'myNewAccount' as CamelCaseString);
});

test('it updates the name of an instruction argument', t => {
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
    t.is(result.arguments[0].name, 'myNewArgument' as CamelCaseString);
});

test('it updates the default value of an instruction argument', t => {
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
    t.deepEqual(result.arguments[0].defaultValue, numberValueNode(1));
    t.is(result.arguments[0].defaultValueStrategy, undefined);
});

test('it updates the default value strategy of an instruction argument', t => {
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
    t.deepEqual(result.arguments[0].defaultValue, numberValueNode(42));
    t.is(result.arguments[0].defaultValueStrategy, 'omitted');
    t.deepEqual(result.arguments[1].defaultValue, numberValueNode(1));
    t.is(result.arguments[1].defaultValueStrategy, 'optional');
});
