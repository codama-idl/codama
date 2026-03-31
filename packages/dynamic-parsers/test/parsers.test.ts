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
import { describe, expect, test } from 'vitest';

import { parseAccountData, parseEventData, parseInstructionData } from '../src';
import { hex } from './_setup';

describe('parseAccountData', () => {
    test('it parses some account data from a root node', () => {
        const root = rootNode(
            programNode({
                accounts: [
                    accountNode({
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
                    }),
                ],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        const result = parseAccountData(root, hex('090500416c6963652a'));
        expect(result).toStrictEqual({
            data: { age: 42, discriminator: 9, firstname: 'Alice' },
            path: [root, root.program, root.program.accounts[0]],
        });
    });
});

describe('parseInstructionData', () => {
    test('it parses some instruction data from a root node', () => {
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
                    }),
                ],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        const result = parseInstructionData(root, hex('090500416c6963652a'));
        expect(result).toStrictEqual({
            data: { age: 42, discriminator: 9, firstname: 'Alice' },
            path: [root, root.program, root.program.instructions[0]],
        });
    });
});

describe('parseEventData', () => {
    test('it parses some event data from a root node', () => {
        const root = rootNode(
            programNode({
                events: [
                    eventNode({
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
                    }),
                ],
                name: 'myProgram',
                publicKey: '1111',
            }),
        );
        const result = parseEventData(root, hex('090500416c6963652a'));
        expect(result).toStrictEqual({
            data: { age: 42, discriminator: 9, firstname: 'Alice' },
            path: [root, root.program, root.program.events[0]],
        });
    });
    test('it parses tuple event data from a root node', () => {
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
        const result = parseEventData(root, hex('01022a000000'));
        expect(result).toStrictEqual({
            data: [42],
            path: [root, root.program, root.program.events[0]],
        });
    });
});
