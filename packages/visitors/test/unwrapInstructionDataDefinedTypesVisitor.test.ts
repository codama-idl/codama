import {
    arrayTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumTypeNode,
    enumVariantTypeNode,
    fixedCountNode,
    instructionNode,
    integerTypeNode,
    programNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { unwrapInstructionDataDefinedTypesVisitor } from '../src';

const structA = structTypeNode([structFieldTypeNode({ identifier: 'foo', type: integerTypeNode('u8') })]);
const structB = structTypeNode([structFieldTypeNode({ identifier: 'bar', type: integerTypeNode('u8') })]);

test('it unwraps defined types used once as a top-level instruction data field', () => {
    // Given a program with a type used only once as the type of a top-level data field.
    const node = rootNode(
        programNode({
            definedTypes: [
                definedTypeNode({ identifier: 'typeA', type: structA }),
                definedTypeNode({ identifier: 'typeB', type: structB }),
            ],
            identifier: 'MyProgram',
            instructions: [
                instructionNode({
                    data: structTypeNode([
                        structFieldTypeNode({ identifier: 'argA', type: definedTypeLinkNode('typeA') }),
                    ]),
                    identifier: 'myInstruction',
                }),
            ],
            publicKey: '1111',
        }),
    );

    // When the defined type link nodes are unwrapped.
    const result = visit(node, unwrapInstructionDataDefinedTypesVisitor());

    // Then we expect the following node.
    expect(result).toStrictEqual(
        rootNode(
            programNode({
                definedTypes: [definedTypeNode({ identifier: 'typeB', type: structB })],
                identifier: 'MyProgram',
                instructions: [
                    instructionNode({
                        data: structTypeNode([structFieldTypeNode({ identifier: 'argA', type: structA })]),
                        identifier: 'myInstruction',
                    }),
                ],
                publicKey: '1111',
            }),
        ),
    );
});

test('it unwraps defined types used once as the instruction data itself', () => {
    // Given an instruction whose data is a link to a type used nowhere else.
    const node = rootNode(
        programNode({
            definedTypes: [definedTypeNode({ identifier: 'myInstructionArgs', type: structA })],
            identifier: 'MyProgram',
            instructions: [
                instructionNode({ data: definedTypeLinkNode('myInstructionArgs'), identifier: 'myInstruction' }),
            ],
            publicKey: '1111',
        }),
    );

    // When the defined type link nodes are unwrapped.
    const result = visit(node, unwrapInstructionDataDefinedTypesVisitor());

    // Then we expect the data to be inlined.
    expect(result).toStrictEqual(
        rootNode(
            programNode({
                identifier: 'MyProgram',
                instructions: [instructionNode({ data: structA, identifier: 'myInstruction' })],
                publicKey: '1111',
            }),
        ),
    );
});

test('it does not unwrap defined type link nodes that are used in more than one place', () => {
    // Given a link node used in an instruction data field and in another place.
    const node = rootNode(
        programNode({
            definedTypes: [
                definedTypeNode({ identifier: 'myType', type: structA }),
                definedTypeNode({ identifier: 'myCopyType', type: definedTypeLinkNode('myType') }),
            ],
            identifier: 'MyProgram',
            instructions: [
                instructionNode({
                    data: structTypeNode([
                        structFieldTypeNode({ identifier: 'myArg', type: definedTypeLinkNode('myType') }),
                    ]),
                    identifier: 'myInstruction',
                }),
            ],
            publicKey: '1111',
        }),
    );

    // When we try to unwrap defined type link nodes for instruction data.
    const result = visit(node, unwrapInstructionDataDefinedTypesVisitor());

    // Then we expect the same node.
    expect(result).toStrictEqual(node);
});

test('it only unwraps defined type link nodes if they are used directly', () => {
    // Given a link node nested inside an array in the instruction data.
    const node = rootNode(
        programNode({
            definedTypes: [definedTypeNode({ identifier: 'myType', type: structA })],
            identifier: 'MyProgram',
            instructions: [
                instructionNode({
                    data: structTypeNode([
                        structFieldTypeNode({
                            identifier: 'myArg',
                            type: arrayTypeNode(definedTypeLinkNode('myType'), fixedCountNode(3)),
                        }),
                    ]),
                    identifier: 'myInstruction',
                }),
            ],
            publicKey: '1111',
        }),
    );

    // When we try to unwrap defined type link nodes for instruction data.
    const result = visit(node, unwrapInstructionDataDefinedTypesVisitor());

    // Then we expect the same node.
    expect(result).toStrictEqual(node);
});

test('it does not unwrap enums', () => {
    // Given an enum used once as a top-level data field.
    const node = rootNode(
        programNode({
            definedTypes: [
                definedTypeNode({
                    identifier: 'myEnum',
                    type: enumTypeNode([enumVariantTypeNode('a'), enumVariantTypeNode('b')]),
                }),
            ],
            identifier: 'MyProgram',
            instructions: [
                instructionNode({
                    data: structTypeNode([
                        structFieldTypeNode({ identifier: 'kind', type: definedTypeLinkNode('myEnum') }),
                    ]),
                    identifier: 'myInstruction',
                }),
            ],
            publicKey: '1111',
        }),
    );

    // When we try to unwrap defined type link nodes for instruction data.
    const result = visit(node, unwrapInstructionDataDefinedTypesVisitor());

    // Then we expect the same node.
    expect(result).toStrictEqual(node);
});

test('it does not unwrap defined type link nodes from other programs', () => {
    // Given a program with a type used once as instruction data.
    const programA = programNode({
        definedTypes: [definedTypeNode({ identifier: 'myType', type: integerTypeNode('u8') })],
        identifier: 'programA',
        instructions: [
            instructionNode({
                data: structTypeNode([
                    structFieldTypeNode({ identifier: 'myArg', type: definedTypeLinkNode('myType') }),
                ]),
                identifier: 'myInstruction',
            }),
        ],
        publicKey: '1111',
    });

    // And another program with a defined type sharing the same name.
    const programB = programNode({
        definedTypes: [
            definedTypeNode({ identifier: 'myType', type: integerTypeNode('u16') }),
            definedTypeNode({ identifier: 'myCopyType', type: definedTypeLinkNode('myType') }),
        ],
        identifier: 'programB',
        publicKey: '2222',
    });

    // When we unwrap defined type link nodes for instruction data for both of them.
    const node = rootNode(programA, { additionalPrograms: [programB] });
    const result = visit(node, unwrapInstructionDataDefinedTypesVisitor());

    // Then we expect program A to have been modified but not program B.
    expect(result).toStrictEqual(
        rootNode(
            programNode({
                identifier: 'programA',
                instructions: [
                    instructionNode({
                        data: structTypeNode([
                            structFieldTypeNode({ identifier: 'myArg', type: integerTypeNode('u8') }),
                        ]),
                        identifier: 'myInstruction',
                    }),
                ],
                publicKey: '1111',
            }),
            { additionalPrograms: [programB] },
        ),
    );
});
