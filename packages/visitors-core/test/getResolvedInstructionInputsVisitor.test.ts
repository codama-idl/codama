import {
    accountValueNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
    pdaSeedValueNode,
    pdaValueNode,
    publicKeyTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getResolvedInstructionInputsVisitor, visit } from '../src';

test('it returns all instruction accounts in order of resolution', () => {
    // Given the following instruction node with an account that defaults to another account.
    const node = instructionNode({
        accounts: [
            instructionAccountNode({
                defaultValue: accountValueNode('authority'),
                isSigner: true,
                isWritable: false,
                name: 'owner',
            }),
            instructionAccountNode({
                isSigner: true,
                isWritable: false,
                name: 'authority',
            }),
        ],
        name: 'myInstruction',
    });

    // When we get its resolved inputs.
    const result = visit(node, getResolvedInstructionInputsVisitor());

    // Then we expect the accounts to be in order of resolution.
    expect(result).toEqual([
        {
            ...node.accounts[1],
            dependsOn: [],
            isPda: false,
            resolvedIsOptional: false,
            resolvedIsSigner: true,
        },
        {
            ...node.accounts[0],
            dependsOn: [accountValueNode('authority')],
            isPda: false,
            resolvedIsOptional: false,
            resolvedIsSigner: true,
        },
    ]);
});

test('it sets the resolved signer to either when a non signer defaults to a signer account', () => {
    // Given the following instruction node such that a non signer account defaults to a signer account.
    const node = instructionNode({
        accounts: [
            instructionAccountNode({
                defaultValue: accountValueNode('authority'),
                isSigner: false,
                isWritable: false,
                name: 'owner',
            }),
            instructionAccountNode({
                isSigner: true,
                isWritable: false,
                name: 'authority',
            }),
        ],
        name: 'myInstruction',
    });

    // When we get its resolved inputs.
    const result = visit(node, getResolvedInstructionInputsVisitor());

    // Then we expect the resolved signer to be either for the non signer account.
    expect(result[1]).toEqual({
        ...node.accounts[0],
        dependsOn: [accountValueNode('authority')],
        isPda: false,
        resolvedIsOptional: false,
        resolvedIsSigner: 'either',
    });
});

test('it sets the resolved signer to either when a signer defaults to a non signer account', () => {
    // Given the following instruction node such that a signer account defaults to a non signer account.
    const node = instructionNode({
        accounts: [
            instructionAccountNode({
                defaultValue: accountValueNode('authority'),
                isSigner: true,
                isWritable: false,
                name: 'owner',
            }),
            instructionAccountNode({
                isSigner: false,
                isWritable: false,
                name: 'authority',
            }),
        ],
        name: 'myInstruction',
    });

    // When we get its resolved inputs.
    const result = visit(node, getResolvedInstructionInputsVisitor());

    // Then we expect the resolved signer to be either for the signer account.
    expect(result[1]).toEqual({
        ...node.accounts[0],
        dependsOn: [accountValueNode('authority')],
        isPda: false,
        resolvedIsOptional: false,
        resolvedIsSigner: 'either',
    });
});

test('it includes instruction data arguments with default values', () => {
    // Given the following instruction node with two arguments such that:
    // - The first argument defaults to an account.
    // - The second argument has no default value.
    const node = instructionNode({
        accounts: [
            instructionAccountNode({
                isSigner: true,
                isWritable: false,
                name: 'owner',
            }),
        ],
        arguments: [
            instructionArgumentNode({
                defaultValue: accountValueNode('owner'),
                name: 'ownerArg',
                type: publicKeyTypeNode(),
            }),
            instructionArgumentNode({
                name: 'argWithoutDefaults',
                type: numberTypeNode('u8'),
            }),
        ],
        name: 'myInstruction',
    });

    // When we get its resolved inputs.
    const result = visit(node, getResolvedInstructionInputsVisitor());

    // Then we expect the following inputs.
    expect(result).toEqual([
        {
            ...node.accounts[0],
            dependsOn: [],
            isPda: false,
            resolvedIsOptional: false,
            resolvedIsSigner: true,
        },
        {
            ...node.arguments[0],
            dependsOn: [accountValueNode('owner')],
        },
    ]);

    // And the argument without default value is not included.
    expect(result.some(input => input.name === 'argWithoutDefaults')).toBe(false);
});

test('it includes instruction extra arguments with default values', () => {
    // Given the following instruction node with two extra arguments such that:
    // - The first argument defaults to an account.
    // - The second argument has no default value.
    const node = instructionNode({
        accounts: [
            instructionAccountNode({
                isSigner: true,
                isWritable: false,
                name: 'owner',
            }),
        ],
        extraArguments: [
            instructionArgumentNode({
                defaultValue: accountValueNode('owner'),
                name: 'ownerArg',
                type: publicKeyTypeNode(),
            }),
            instructionArgumentNode({
                name: 'argWithoutDefaults',
                type: numberTypeNode('u8'),
            }),
        ],
        name: 'myInstruction',
    });

    // When we get its resolved inputs.
    const result = visit(node, getResolvedInstructionInputsVisitor());

    // Then we expect the following inputs.
    expect(result).toEqual([
        {
            ...node.accounts[0],
            dependsOn: [],
            isPda: false,
            resolvedIsOptional: false,
            resolvedIsSigner: true,
        },
        {
            ...node.extraArguments![0],
            dependsOn: [accountValueNode('owner')],
        },
    ]);

    // And the argument without default value is not included.
    expect(result.some(input => input.name === 'argWithoutDefaults')).toBe(false);
});

test('it returns an empty array for empty instructions', () => {
    // Given the following empty instruction node.
    const node = instructionNode({ name: 'myInstruction' });

    // When we get its resolved inputs.
    const result = visit(node, getResolvedInstructionInputsVisitor());

    // Then we expect an empty array.
    expect(result).toEqual([]);
});

test('it resolves the seeds of a PdaValueNode first', () => {
    // Given the following instruction node with an account that defaults to another account.
    const node = instructionNode({
        accounts: [
            instructionAccountNode({
                defaultValue: pdaValueNode('counter', [pdaSeedValueNode('authority', accountValueNode('payer'))]),
                isSigner: false,
                isWritable: false,
                name: 'counter',
            }),
            instructionAccountNode({
                isSigner: true,
                isWritable: false,
                name: 'payer',
            }),
        ],
        name: 'myInstruction',
    });

    // When we get its resolved inputs.
    const result = visit(node, getResolvedInstructionInputsVisitor());

    // Then we expect the accounts to be in order of resolution.
    expect(result).toEqual([
        {
            ...node.accounts[1],
            dependsOn: [],
            isPda: false,
            resolvedIsOptional: false,
            resolvedIsSigner: true,
        },
        {
            ...node.accounts[0],
            dependsOn: [accountValueNode('payer')],
            isPda: false,
            resolvedIsOptional: false,
            resolvedIsSigner: false,
        },
    ]);
});

test('it resolves the program id of a PdaValueNode first', () => {
    // Given the following instruction node with an account that defaults to another account.
    const node = instructionNode({
        accounts: [
            instructionAccountNode({
                defaultValue: pdaValueNode('counter', [], accountValueNode('counterProgram')),
                isSigner: false,
                isWritable: false,
                name: 'counter',
            }),
            instructionAccountNode({
                isSigner: false,
                isWritable: false,
                name: 'counterProgram',
            }),
        ],
        name: 'myInstruction',
    });

    // When we get its resolved inputs.
    const result = visit(node, getResolvedInstructionInputsVisitor());

    // Then we expect the accounts to be in order of resolution.
    expect(result).toEqual([
        {
            ...node.accounts[1],
            dependsOn: [],
            isPda: false,
            resolvedIsOptional: false,
            resolvedIsSigner: false,
        },
        {
            ...node.accounts[0],
            dependsOn: [accountValueNode('counterProgram')],
            isPda: false,
            resolvedIsOptional: false,
            resolvedIsSigner: false,
        },
    ]);
});
