import {
    accountNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumTypeNode,
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

import { getDefinedTypeHistogramVisitor } from '../src';

test('it counts the amount of times defined types are used within the tree', () => {
    // Given the following tree.
    const node = programNode({
        accounts: [
            accountNode({
                data: structTypeNode([
                    structFieldTypeNode({
                        name: 'field1',
                        type: definedTypeLinkNode('myStruct'),
                    }),
                    structFieldTypeNode({
                        name: 'field2',
                        type: definedTypeLinkNode('myEnum'),
                    }),
                ]),
                name: 'myAccount',
            }),
        ],
        definedTypes: [
            definedTypeNode({
                name: 'myStruct',
                type: structTypeNode([]),
            }),
            definedTypeNode({
                name: 'myEnum',
                type: enumTypeNode([]),
            }),
        ],
        errors: [],
        instructions: [
            instructionNode({
                accounts: [],
                arguments: [
                    instructionArgumentNode({
                        name: 'arg1',
                        type: definedTypeLinkNode('myStruct'),
                    }),
                ],
                name: 'myInstruction',
            }),
        ],
        name: 'customProgram',
        publicKey: '1111',
        version: '1.0.0',
    });

    // When we get its defined type histogram.
    const histogram = visit(node, getDefinedTypeHistogramVisitor());

    // Then we expect the following histogram.
    expect(histogram).toEqual({
        'customProgram.myEnum': {
            directlyAsInstructionArgs: 0,
            inAccounts: 1,
            inDefinedTypes: 0,
            inInstructionArgs: 0,
            total: 1,
        },
        'customProgram.myStruct': {
            directlyAsInstructionArgs: 1,
            inAccounts: 1,
            inDefinedTypes: 0,
            inInstructionArgs: 1,
            total: 2,
        },
    });
});

test('it counts links from different programs separately', () => {
    // Given a program node with a defined type used in another type.
    const programA = programNode({
        definedTypes: [
            definedTypeNode({ name: 'myType', type: numberTypeNode('u8') }),
            definedTypeNode({ name: 'myCopyType', type: definedTypeLinkNode('myType') }),
        ],
        name: 'programA',
        publicKey: '1111',
    });

    // And another program with a defined type sharing the same name.
    const programB = programNode({
        definedTypes: [
            definedTypeNode({ name: 'myType', type: numberTypeNode('u16') }),
            definedTypeNode({ name: 'myCopyType', type: definedTypeLinkNode('myType') }),
        ],
        name: 'programB',
        publicKey: '2222',
    });

    // When we unwrap the defined type from programA.
    const node = rootNode(programA, [programB]);
    const histogram = visit(node, getDefinedTypeHistogramVisitor());

    // Then we expect programA to have been modified but not programB.
    expect(histogram).toStrictEqual({
        'programA.myType': {
            directlyAsInstructionArgs: 0,
            inAccounts: 0,
            inDefinedTypes: 1,
            inInstructionArgs: 0,
            total: 1,
        },
        'programB.myType': {
            directlyAsInstructionArgs: 0,
            inAccounts: 0,
            inDefinedTypes: 1,
            inInstructionArgs: 0,
            total: 1,
        },
    });
});
