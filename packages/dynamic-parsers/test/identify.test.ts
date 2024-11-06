import {
    accountNode,
    constantDiscriminatorNode,
    constantValueNodeFromBytes,
    instructionNode,
    programNode,
    rootNode,
    sizeDiscriminatorNode,
} from '@codama/nodes';
import { describe, expect, test } from 'vitest';

import { identifyAccountData, identifyInstructionData } from '../src';
import { hex } from './_setup';

describe('identifyAccountData', () => {
    test('it identifies an account using its discriminator nodes', () => {
        const root = rootNode(
            programNode({
                accounts: [accountNode({ discriminators: [sizeDiscriminatorNode(4)], name: 'myAccount' })],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        const result = identifyAccountData(root, hex('01020304'));
        expect(result).toStrictEqual([root, root.program, root.program.accounts[0]]);
    });
    test('it fails to identify accounts whose discriminator nodes do not match the given data', () => {
        const root = rootNode(
            programNode({
                accounts: [accountNode({ discriminators: [sizeDiscriminatorNode(999)], name: 'myAccount' })],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        const result = identifyAccountData(root, hex('01020304'));
        expect(result).toBeUndefined();
    });
    test('it fails to identify accounts with no discriminator nodes', () => {
        const root = rootNode(
            programNode({ accounts: [accountNode({ name: 'myAccount' })], name: 'myProgram', publicKey: '1111' }),
        );
        const result = identifyAccountData(root, hex('01020304'));
        expect(result).toBeUndefined();
    });
    test('it identifies the first matching account if multiple accounts match', () => {
        const root = rootNode(
            programNode({
                accounts: [
                    accountNode({
                        discriminators: [sizeDiscriminatorNode(4)],
                        name: 'accountA',
                    }),
                    accountNode({
                        discriminators: [constantDiscriminatorNode(constantValueNodeFromBytes('base16', 'ff'))],
                        name: 'accountB',
                    }),
                ],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        const result = identifyAccountData(root, hex('ff010203'));
        expect(result).toStrictEqual([root, root.program, root.program.accounts[0]]);
    });
    test('it does not identify accounts in additional programs', () => {
        const root = rootNode(programNode({ name: 'myProgram', publicKey: '1111' }), [
            programNode({
                accounts: [accountNode({ discriminators: [sizeDiscriminatorNode(4)], name: 'myAccount' })],
                name: 'myProgram',
                publicKey: '1111',
            }),
        ]);
        const result = identifyAccountData(root, hex('01020304'));
        expect(result).toBeUndefined();
    });
    test('it does not identify accounts using instruction discriminators', () => {
        const root = rootNode(programNode({ name: 'myProgram', publicKey: '1111' }), [
            programNode({
                instructions: [instructionNode({ discriminators: [sizeDiscriminatorNode(4)], name: 'myInstruction' })],
                name: 'myProgram',
                publicKey: '1111',
            }),
        ]);
        const result = identifyAccountData(root, hex('01020304'));
        expect(result).toBeUndefined();
    });
});

describe('identifyInstructionData', () => {
    test('it identifies an instruction using its discriminator nodes', () => {
        const root = rootNode(
            programNode({
                instructions: [instructionNode({ discriminators: [sizeDiscriminatorNode(4)], name: 'myInstruction' })],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        const result = identifyInstructionData(root, hex('01020304'));
        expect(result).toStrictEqual([root, root.program, root.program.instructions[0]]);
    });
    test('it fails to identify instructions whose discriminator nodes do not match the given data', () => {
        const root = rootNode(
            programNode({
                instructions: [
                    instructionNode({ discriminators: [sizeDiscriminatorNode(999)], name: 'myInstruction' }),
                ],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        const result = identifyInstructionData(root, hex('01020304'));
        expect(result).toBeUndefined();
    });
    test('it fails to identify instructions with no discriminator nodes', () => {
        const root = rootNode(
            programNode({
                instructions: [instructionNode({ name: 'myInstruction' })],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        const result = identifyInstructionData(root, hex('01020304'));
        expect(result).toBeUndefined();
    });
    test('it identifies the first matching instruction if multiple instructions match', () => {
        const root = rootNode(
            programNode({
                instructions: [
                    instructionNode({
                        discriminators: [sizeDiscriminatorNode(4)],
                        name: 'instructionA',
                    }),
                    instructionNode({
                        discriminators: [constantDiscriminatorNode(constantValueNodeFromBytes('base16', 'ff'))],
                        name: 'instructionB',
                    }),
                ],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        const result = identifyInstructionData(root, hex('ff010203'));
        expect(result).toStrictEqual([root, root.program, root.program.instructions[0]]);
    });
    test('it does not identify instructions in additional programs', () => {
        const root = rootNode(programNode({ name: 'myProgram', publicKey: '1111' }), [
            programNode({
                instructions: [instructionNode({ discriminators: [sizeDiscriminatorNode(4)], name: 'myInstruction' })],
                name: 'myProgram',
                publicKey: '1111',
            }),
        ]);
        const result = identifyInstructionData(root, hex('01020304'));
        expect(result).toBeUndefined();
    });
    test('it does not identify instructions using account discriminators', () => {
        const root = rootNode(programNode({ name: 'myProgram', publicKey: '1111' }), [
            programNode({
                accounts: [accountNode({ discriminators: [sizeDiscriminatorNode(4)], name: 'myAccount' })],
                name: 'myProgram',
                publicKey: '1111',
            }),
        ]);
        const result = identifyInstructionData(root, hex('01020304'));
        expect(result).toBeUndefined();
    });
});
