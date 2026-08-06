import {
    accountNode,
    bytesTypeNode,
    constantDiscriminatorNode,
    constantValueNode,
    constantValueNodeFromBytes,
    eventNode,
    fieldDiscriminatorNode,
    fixedSizeTypeNode,
    hiddenPrefixTypeNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
    numberValueNode,
    programNode,
    rootNode,
    sizePrefixTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@codama/nodes';
import { AccountRole } from '@solana/instructions';
import { describe, expect, test } from 'vitest';

import { parseAccountData, parseData, parseEventData, parseInstruction, parseInstructionData } from '../src';
import { hex } from './_setup';

describe('parseAccountData', () => {
    test('it parses some account data from a root node', () => {
        const account = accountNode({
            data: structTypeNode([
                structFieldTypeNode({
                    defaultValue: numberValueNode(9),
                    name: 'discriminator',
                    type: numberTypeNode('u8'),
                }),
                structFieldTypeNode({
                    name: 'firstname',
                    type: sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u16')),
                }),
                structFieldTypeNode({
                    name: 'age',
                    type: numberTypeNode('u8'),
                }),
            ]),
            discriminators: [fieldDiscriminatorNode('discriminator')],
            name: 'myAccount',
        });
        const root = rootNode(
            programNode({
                accounts: [account],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        const result = parseAccountData(root, hex('090500416c6963652a'));
        expect(result).toStrictEqual({
            data: { age: 42, discriminator: 9, firstname: 'Alice' },
            path: [root, root.program, account],
        });
    });

    test('it decodes a single account without discriminator', () => {
        // Given a program with exactly one account without discriminator.
        const account = accountNode({
            data: structTypeNode([structFieldTypeNode({ name: 'value', type: numberTypeNode('u32') })]),
            name: 'myAccount',
        });
        const root = rootNode(
            programNode({
                accounts: [account],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        // When we parse account data that matches no discriminator.
        const result = parseAccountData(root, hex('2a000000'));
        // Then we expect the single account to be decoded via the fallback.
        expect(result).toStrictEqual({
            data: { value: 42 },
            path: [root, root.program, account],
        });
    });
});

describe('parseInstructionData', () => {
    test('it parses some instruction data from a root node', () => {
        const instruction = instructionNode({
            arguments: [
                instructionArgumentNode({
                    defaultValue: numberValueNode(9),
                    name: 'discriminator',
                    type: numberTypeNode('u8'),
                }),
                instructionArgumentNode({
                    name: 'firstname',
                    type: sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u16')),
                }),
                instructionArgumentNode({
                    name: 'age',
                    type: numberTypeNode('u8'),
                }),
            ],
            discriminators: [fieldDiscriminatorNode('discriminator')],
            name: 'myInstruction',
        });
        const root = rootNode(
            programNode({
                instructions: [instruction],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        const result = parseInstructionData(root, hex('090500416c6963652a'));
        expect(result).toStrictEqual({
            data: { age: 42, discriminator: 9, firstname: 'Alice' },
            path: [root, root.program, instruction],
        });
    });

    test('it decodes a single instruction without discriminator', () => {
        // Given a program with exactly one instruction that has no discriminator (Memo-shaped).
        const instruction = instructionNode({
            arguments: [instructionArgumentNode({ name: 'message', type: stringTypeNode('utf8') })],
            name: 'memo',
        });
        const root = rootNode(
            programNode({
                instructions: [instruction],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );

        // When we parse instruction data that has no discriminator selector ("Hello" as UTF-8).
        const result = parseInstructionData(root, hex('48656c6c6f'));

        // Then we expect instruction to be decoded.
        expect(result).toStrictEqual({
            data: { message: 'Hello' },
            path: [root, root.program, instruction],
        });
    });

    test('it does not fall back to direct decode when the program has more than one instruction', () => {
        // Given a program with two instructions without discriminator.
        const root = rootNode(
            programNode({
                instructions: [
                    instructionNode({
                        arguments: [instructionArgumentNode({ name: 'message', type: stringTypeNode('utf8') })],
                        name: 'instructionA',
                    }),
                    instructionNode({
                        arguments: [instructionArgumentNode({ name: 'message', type: stringTypeNode('utf8') })],
                        name: 'instructionB',
                    }),
                ],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );

        // When we parse instruction data that matches no discriminator.
        const result = parseInstructionData(root, hex('48656c6c6f'));

        // Then we expect no result.
        expect(result).toBeUndefined();
    });

    test('it returns undefined for a single instruction with a discriminator that does not match', () => {
        // Given a program with one instruction that declares a discriminator field.
        const root = rootNode(
            programNode({
                instructions: [
                    instructionNode({
                        arguments: [
                            instructionArgumentNode({
                                defaultValue: numberValueNode(42),
                                name: 'discriminator',
                                type: numberTypeNode('u8'),
                            }),
                        ],
                        discriminators: [fieldDiscriminatorNode('discriminator')],
                        name: 'myInstruction',
                    }),
                ],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );

        // When we parse bytes whose leading byte (0x07) does not match the discriminator default (42).
        const result = parseInstructionData(root, hex('07'));

        // Then we expect no result.
        expect(result).toBeUndefined();
    });

    test('it does not decode via fallback when an instruction with discriminator also exists', () => {
        // Given a program with instruction with discriminator and instruction without discriminator.
        const root = rootNode(
            programNode({
                instructions: [
                    instructionNode({
                        arguments: [
                            instructionArgumentNode({
                                defaultValue: numberValueNode(9),
                                name: 'discriminator',
                                type: numberTypeNode('u8'),
                            }),
                        ],
                        discriminators: [fieldDiscriminatorNode('discriminator')],
                        name: 'instructionWithDiscriminator',
                    }),
                    instructionNode({
                        arguments: [instructionArgumentNode({ name: 'message', type: stringTypeNode('utf8') })],
                        name: 'instructionWithoutDiscriminator',
                    }),
                ],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        // When we parse bytes whose leading byte (0x48) does not match the discriminator default (9).
        const result = parseInstructionData(root, hex('48656c6c6f'));
        // Then we expect no result because more than one instruction candidate exists.
        expect(result).toBeUndefined();
    });
});

describe('parseEventData', () => {
    test('it parses some event data from a root node', () => {
        const event = eventNode({
            data: structTypeNode([
                structFieldTypeNode({
                    defaultValue: numberValueNode(9),
                    name: 'discriminator',
                    type: numberTypeNode('u8'),
                }),
                structFieldTypeNode({
                    name: 'firstname',
                    type: sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u16')),
                }),
                structFieldTypeNode({
                    name: 'age',
                    type: numberTypeNode('u8'),
                }),
            ]),
            discriminators: [fieldDiscriminatorNode('discriminator')],
            name: 'myEvent',
        });
        const root = rootNode(
            programNode({
                events: [event],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        const result = parseEventData(root, hex('090500416c6963652a'));
        expect(result).toStrictEqual({
            data: { age: 42, discriminator: 9, firstname: 'Alice' },
            path: [root, root.program, event],
        });
    });
    test('it parses tuple event data from a root node', () => {
        const event = eventNode({
            data: hiddenPrefixTypeNode(tupleTypeNode([numberTypeNode('u32')]), [
                constantValueNode(fixedSizeTypeNode(bytesTypeNode(), 2), constantValueNodeFromBytes('base16', '0102')),
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
        });
        const root = rootNode(
            programNode({
                events: [event],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        const result = parseEventData(root, hex('01022a000000'));
        expect(result).toStrictEqual({
            data: [42],
            path: [root, root.program, event],
        });
    });

    test('it decodes a single event without discriminator', () => {
        // Given a program with exactly one non-discriminated event.
        const event = eventNode({
            data: structTypeNode([structFieldTypeNode({ name: 'value', type: numberTypeNode('u32') })]),
            name: 'myEvent',
        });
        const root = rootNode(
            programNode({
                events: [event],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        // When we parse event data that matches no discriminator.
        const result = parseEventData(root, hex('2a000000'));
        // Then we expect the event to be decoded via the fallback.
        expect(result).toStrictEqual({
            data: { value: 42 },
            path: [root, root.program, event],
        });
    });
});

describe('parseInstruction', () => {
    test('it parses a single instruction without discriminator', () => {
        // Given a Memo-shaped program: one instruction without discriminator with a single signer account.
        const memoInstruction = instructionNode({
            accounts: [instructionAccountNode({ isSigner: true, isWritable: false, name: 'signer' })],
            arguments: [instructionArgumentNode({ name: 'message', type: stringTypeNode('utf8') })],
            name: 'memo',
        });
        const root = rootNode(
            programNode({
                instructions: [memoInstruction],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );

        // And a concrete instruction carrying "Hello" as UTF-8 data and one account meta.
        const instruction = {
            accounts: [{ address: '1111', role: AccountRole.READONLY_SIGNER }],
            data: hex('48656c6c6f'),
            programAddress: 'myProgramAddress',
        } as unknown as Parameters<typeof parseInstruction>[1];

        // When we parse the instruction.
        const result = parseInstruction(root, instruction);

        // Then we expect the decoded data, the instruction path, and the account meta with its node name.
        expect(result).toStrictEqual({
            accounts: [{ address: '1111', name: 'signer', role: AccountRole.READONLY_SIGNER }],
            data: { message: 'Hello' },
            path: [root, root.program, memoInstruction],
        });
    });

    test('it parses an instruction from an additional program using the program address', () => {
        // Given a token-shaped main program and an ATA-shaped additional program whose
        // instructions share the same one-byte field discriminator.
        const discriminator = (defaultValue: number) =>
            instructionArgumentNode({
                defaultValue: numberValueNode(defaultValue),
                name: 'discriminator',
                type: numberTypeNode('u8'),
            });
        const root = rootNode(
            programNode({
                instructions: [
                    instructionNode({
                        accounts: [instructionAccountNode({ isSigner: false, isWritable: true, name: 'account' })],
                        arguments: [discriminator(1)],
                        discriminators: [fieldDiscriminatorNode('discriminator')],
                        name: 'initializeAccount',
                    }),
                ],
                name: 'token',
                publicKey: '1111',
            }),
            [
                programNode({
                    instructions: [
                        instructionNode({
                            accounts: [
                                instructionAccountNode({ isSigner: true, isWritable: true, name: 'payer' }),
                                instructionAccountNode({ isSigner: false, isWritable: true, name: 'ata' }),
                            ],
                            arguments: [discriminator(1)],
                            discriminators: [fieldDiscriminatorNode('discriminator')],
                            name: 'createAssociatedTokenIdempotent',
                        }),
                    ],
                    name: 'associatedToken',
                    publicKey: '2222',
                }),
            ],
        );

        // And a concrete instruction targeting the additional program's address.
        const instruction = {
            accounts: [
                { address: 'payer111', role: AccountRole.WRITABLE_SIGNER },
                { address: 'ata11111', role: AccountRole.WRITABLE },
            ],
            data: hex('01'),
            programAddress: '2222',
        } as unknown as Parameters<typeof parseInstruction>[1];

        // When we parse the instruction.
        const result = parseInstruction(root, instruction);

        // Then we expect the additional program's instruction, not the main program's.
        expect(result).toStrictEqual({
            accounts: [
                { address: 'payer111', name: 'payer', role: AccountRole.WRITABLE_SIGNER },
                { address: 'ata11111', name: 'ata', role: AccountRole.WRITABLE },
            ],
            data: { discriminator: 1 },
            path: [root, root.additionalPrograms[0], root.additionalPrograms[0].instructions[0]],
        });
    });
});

describe('parseData', () => {
    test('it decodes via fallback a single node without discriminator', () => {
        // Given a program with one account without discriminator.
        const account = accountNode({
            data: structTypeNode([structFieldTypeNode({ name: 'value', type: numberTypeNode('u32') })]),
            name: 'myAccount',
        });
        const root = rootNode(
            programNode({
                accounts: [account],
                instructions: [
                    instructionNode({
                        arguments: [instructionArgumentNode({ name: 'message', type: stringTypeNode('utf8') })],
                        name: 'myInstruction',
                    }),
                ],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        // When we parse only the account node kind and no discriminator matches.
        const result = parseData(root, hex('2a000000'), 'accountNode');
        // Then we expect the single account to be decoded via the fallback.
        expect(result).toStrictEqual({
            data: { value: 42 },
            path: [root, root.program, account],
        });
    });

    test('it does not decode via fallback when trying to parse multiple node kinds without discriminator', () => {
        // Given a program with account and instruction without discriminators.
        const root = rootNode(
            programNode({
                accounts: [
                    accountNode({
                        data: structTypeNode([structFieldTypeNode({ name: 'value', type: numberTypeNode('u32') })]),
                        name: 'accountWithoutDiscriminator',
                    }),
                ],
                instructions: [
                    instructionNode({
                        arguments: [instructionArgumentNode({ name: 'message', type: stringTypeNode('utf8') })],
                        name: 'instructionWithoutDiscriminator',
                    }),
                ],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        // When we parse with the default (all) kinds and no discriminator matches.
        const result = parseData(root, hex('2a000000'));
        // Then we expect no result because two candidates are ambiguous.
        expect(result).toBeUndefined();
    });
});
