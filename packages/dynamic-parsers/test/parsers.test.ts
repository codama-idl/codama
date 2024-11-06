import {
    accountNode,
    fieldDiscriminatorNode,
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
} from '@codama/nodes';
import { describe, expect, test } from 'vitest';

import { parseAccountData, parseInstructionData } from '../src';
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
