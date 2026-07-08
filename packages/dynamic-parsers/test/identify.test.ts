import {
    accountNode,
    bytesTypeNode,
    constantDiscriminatorNode,
    constantValueNode,
    constantValueNodeFromBytes,
    eventNode,
    fixedSizeTypeNode,
    hiddenPrefixTypeNode,
    instructionNode,
    numberTypeNode,
    programNode,
    rootNode,
    sizeDiscriminatorNode,
    structTypeNode,
    tupleTypeNode,
} from '@codama/nodes';
import { describe, expect, test } from 'vitest';

import { identifyAccountData, identifyData, identifyEventData, identifyInstructionData } from '../src';
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
    test('it identifies a single account without discriminators as a fallback', () => {
        // Given a program with exactly one account that has no discriminator nodes.
        const root = rootNode(
            programNode({ accounts: [accountNode({ name: 'myAccount' })], name: 'myProgram', publicKey: '1111' }),
        );
        // When we identify account data that matches no discriminator.
        const result = identifyAccountData(root, hex('01020304'));
        // Then we expect the sole non-discriminated account to be identified as the fallback.
        expect(result).toStrictEqual([root, root.program, root.program.accounts[0]]);
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
    test('it identifies a single instruction without discriminator as a fallback', () => {
        // Given a program with exactly one instruction that has no discriminator nodes.
        const root = rootNode(
            programNode({
                instructions: [instructionNode({ name: 'myInstruction' })],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        // When we identify instruction data that matches no discriminator.
        const result = identifyInstructionData(root, hex('01020304'));
        // Then we expect the single instruction to be identified as the fallback.
        expect(result).toStrictEqual([root, root.program, root.program.instructions[0]]);
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

    test('it does not identify via fallback when an instruction with discriminator also exists', () => {
        // Given a program with instruction with discriminator and instruction without discriminator.
        const root = rootNode(
            programNode({
                instructions: [
                    instructionNode({ discriminators: [sizeDiscriminatorNode(4)], name: 'withDiscriminator' }),
                    instructionNode({ name: 'withoutDiscriminator' }),
                ],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        // When we identify bytes that match no discriminator (length 5, not 4).
        const result = identifyInstructionData(root, hex('0102030405'));
        // Then we expect no result because more than one instruction candidate exists.
        expect(result).toBeUndefined();
    });

    test('it prefers a discriminator match over a fallback', () => {
        // Given a program with a instruction with discriminator and without.
        const root = rootNode(
            programNode({
                instructions: [
                    instructionNode({ discriminators: [sizeDiscriminatorNode(4)], name: 'withDiscriminator' }),
                    instructionNode({ name: 'withoutDiscriminator' }),
                ],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        // When we identify bytes that match the discriminator (length 4).
        const result = identifyInstructionData(root, hex('01020304'));
        // Then we expect the discriminated instruction, not the fallback.
        expect(result).toStrictEqual([root, root.program, root.program.instructions[0]]);
    });

    test('it does not identify via fallback more than one instructions without discriminator', () => {
        // Given a program with two instructions that have no discriminator.
        const root = rootNode(
            programNode({
                instructions: [instructionNode({ name: 'instructionA' }), instructionNode({ name: 'instructionB' })],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        // When we identify instruction data that matches no discriminator.
        const result = identifyInstructionData(root, hex('48656c6c6f'));
        // Then we expect no result because the fallback is ambiguous.
        expect(result).toBeUndefined();
    });
});

describe('identifyEventData', () => {
    test('it identifies an event using its discriminator nodes', () => {
        const root = rootNode(
            programNode({
                events: [
                    eventNode({
                        data: structTypeNode([]),
                        discriminators: [sizeDiscriminatorNode(4)],
                        name: 'myEvent',
                    }),
                ],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        const result = identifyEventData(root, hex('01020304'));
        expect(result).toStrictEqual([root, root.program, root.program.events[0]]);
    });
    test('it fails to identify events whose discriminator nodes do not match the given data', () => {
        const root = rootNode(
            programNode({
                events: [
                    eventNode({
                        data: structTypeNode([]),
                        discriminators: [sizeDiscriminatorNode(999)],
                        name: 'myEvent',
                    }),
                ],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        const result = identifyEventData(root, hex('01020304'));
        expect(result).toBeUndefined();
    });
    test('it identifies a single event without discriminators as a fallback', () => {
        // Given a program with exactly one event that has no discriminator nodes.
        const root = rootNode(
            programNode({
                events: [eventNode({ data: structTypeNode([]), name: 'myEvent' })],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        // When we identify event data that matches no discriminator.
        const result = identifyEventData(root, hex('01020304'));
        // Then we expect the single event to be identified as the fallback.
        expect(result).toStrictEqual([root, root.program, root.program.events[0]]);
    });
    test('it does not identify events using instruction discriminators', () => {
        const root = rootNode(
            programNode({
                instructions: [instructionNode({ discriminators: [sizeDiscriminatorNode(4)], name: 'myInstruction' })],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        const result = identifyEventData(root, hex('01020304'));
        expect(result).toBeUndefined();
    });
    test('it identifies tuple events using constant discriminators', () => {
        const root = rootNode(
            programNode({
                events: [
                    eventNode({
                        data: hiddenPrefixTypeNode(tupleTypeNode([numberTypeNode('u32')]), [
                            constantValueNode(
                                fixedSizeTypeNode(bytesTypeNode(), 2),
                                constantValueNodeFromBytes('base16', '0102'),
                            ),
                        ]),
                        discriminators: [
                            constantDiscriminatorNode(
                                constantValueNode(
                                    fixedSizeTypeNode(bytesTypeNode(), 2),
                                    constantValueNodeFromBytes('base16', '0102'),
                                ),
                            ),
                        ],
                        name: 'tupleEvent',
                    }),
                ],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        const result = identifyEventData(root, hex('01022a000000'));
        expect(result).toStrictEqual([root, root.program, root.program.events[0]]);
    });
});

describe('identifyData', () => {
    test('it identifies via fallback single node without discriminator', () => {
        // Given a program with one account without discriminator.
        const root = rootNode(
            programNode({
                accounts: [accountNode({ name: 'myAccount' })],
                instructions: [instructionNode({ name: 'myInstruction' })],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        // When we identify only account node kind.
        const result = identifyData(root, hex('01020304'), 'accountNode');
        // Then we expect the single account to be identified as the fallback.
        expect(result).toStrictEqual([root, root.program, root.program.accounts[0]]);
    });

    test('it does not identify via fallback when trying to identify multiple node kinds without discriminator', () => {
        // Given a program with account and instruction without discriminators.
        const root = rootNode(
            programNode({
                accounts: [accountNode({ name: 'accountWithoutDiscriminator' })],
                instructions: [instructionNode({ name: 'instructionWithoutDiscriminator' })],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        // When we identify with the default (all) kinds and no discriminator matches.
        const result = identifyData(root, hex('01020304'));
        // Then we expect no result because two candidates are ambiguous.
        expect(result).toBeUndefined();
    });
});
