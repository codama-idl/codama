import {
    arrayTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    fixedCountNode,
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
    programNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { unwrapInstructionArgsDefinedTypesVisitor } from '../src';

test('it unwraps defined type link nodes used as instruction arguments', () => {
    // Given a program with a type used only once as a direct instruction argument.
    const node = rootNode(
        programNode({
            definedTypes: [
                definedTypeNode({
                    name: 'typeA',
                    type: structTypeNode([structFieldTypeNode({ name: 'foo', type: numberTypeNode('u8') })]),
                }),
                definedTypeNode({
                    name: 'typeB',
                    type: structTypeNode([structFieldTypeNode({ name: 'bar', type: numberTypeNode('u8') })]),
                }),
            ],
            instructions: [
                instructionNode({
                    arguments: [instructionArgumentNode({ name: 'argA', type: definedTypeLinkNode('typeA') })],
                    name: 'myInstruction',
                }),
            ],
            name: 'MyProgram',
            publicKey: '1111',
            version: '1.2.3',
        }),
    );

    // When the defined type link nodes are unwrapped.
    const result = visit(node, unwrapInstructionArgsDefinedTypesVisitor());

    // Then we expect the following node.
    expect(result).toStrictEqual(
        rootNode(
            programNode({
                definedTypes: [
                    definedTypeNode({
                        name: 'typeB',
                        type: structTypeNode([structFieldTypeNode({ name: 'bar', type: numberTypeNode('u8') })]),
                    }),
                ],
                instructions: [
                    instructionNode({
                        arguments: [
                            instructionArgumentNode({
                                name: 'argA',
                                type: structTypeNode([
                                    structFieldTypeNode({ name: 'foo', type: numberTypeNode('u8') }),
                                ]),
                            }),
                        ],
                        name: 'myInstruction',
                    }),
                ],
                name: 'MyProgram',
                publicKey: '1111',
                version: '1.2.3',
            }),
        ),
    );
});

test('it does not unwrap defined type link nodes that are used in more than one place.', () => {
    // Given a link node used in an instruction argument and in another place.
    const node = rootNode(
        programNode({
            definedTypes: [
                definedTypeNode({
                    name: 'myType',
                    type: structTypeNode([structFieldTypeNode({ name: 'foo', type: numberTypeNode('u8') })]),
                }),
                definedTypeNode({ name: 'myCopyType', type: definedTypeLinkNode('myType') }),
            ],
            instructions: [
                instructionNode({
                    arguments: [instructionArgumentNode({ name: 'myArg', type: definedTypeLinkNode('myType') })],
                    name: 'myInstruction',
                }),
            ],
            name: 'MyProgram',
            publicKey: '1111',
            version: '1.2.3',
        }),
    );

    // When we try to unwrap defined type link nodes for instruction arguments.
    const result = visit(node, unwrapInstructionArgsDefinedTypesVisitor());

    // Then we expect the same node.
    expect(result).toStrictEqual(node);
});

test('it only unwraps defined type link nodes if they are direct instruction arguments', () => {
    // Given a link node used in an instruction argument but not as a direct argument.
    const node = rootNode(
        programNode({
            definedTypes: [
                definedTypeNode({
                    name: 'myType',
                    type: structTypeNode([structFieldTypeNode({ name: 'foo', type: numberTypeNode('u8') })]),
                }),
            ],
            instructions: [
                instructionNode({
                    arguments: [
                        instructionArgumentNode({
                            name: 'myArg',
                            type: arrayTypeNode(definedTypeLinkNode('myType'), fixedCountNode(3)),
                        }),
                    ],
                    name: 'myInstruction',
                }),
            ],
            name: 'MyProgram',
            publicKey: '1111',
            version: '1.2.3',
        }),
    );

    // When we try to unwrap defined type link nodes for instruction arguments.
    const result = visit(node, unwrapInstructionArgsDefinedTypesVisitor());

    // Then we expect the same node.
    expect(result).toStrictEqual(node);
});

test('it does not unwrap defined type link nodes from other programs', () => {
    // Given a program that defines the
    const programA = programNode({
        definedTypes: [definedTypeNode({ name: 'myType', type: numberTypeNode('u8') })],
        instructions: [
            instructionNode({
                arguments: [instructionArgumentNode({ name: 'myArg', type: definedTypeLinkNode('myType') })],
                name: 'myInstruction',
            }),
        ],
        name: 'programA',
        publicKey: '1111',
        version: '1.2.3',
    });

    // And another program with a defined type sharing the same name.
    const programB = programNode({
        definedTypes: [
            definedTypeNode({ name: 'myType', type: numberTypeNode('u16') }),
            definedTypeNode({ name: 'myCopyType', type: definedTypeLinkNode('myType') }),
        ],
        name: 'programB',
        publicKey: '2222',
        version: '1.2.3',
    });

    // When we unwrap defined type link nodes for instruction arguments for both of them.
    const node = rootNode(programA, [programB]);
    const result = visit(node, unwrapInstructionArgsDefinedTypesVisitor());

    // Then we expect program A to have been modified but not program B.
    expect(result).toStrictEqual(
        rootNode(
            programNode({
                instructions: [
                    instructionNode({
                        arguments: [instructionArgumentNode({ name: 'myArg', type: numberTypeNode('u8') })],
                        name: 'myInstruction',
                    }),
                ],
                name: 'programA',
                publicKey: '1111',
                version: '1.2.3',
            }),
            [programB],
        ),
    );
});
