import {
    accountNode,
    constantPdaSeedNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumTypeNode,
    enumValueNode,
    eventNode,
    instructionAccountNode,
    instructionNode,
    integerTypeNode,
    pdaNode,
    programLinkNode,
    programNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { getDefinedTypeHistogramVisitor } from '../src';

const counts = (overrides: Partial<Record<string, number>>) => ({
    directlyAsInstructionData: 0,
    inAccounts: 0,
    inDefinedTypes: 0,
    inEvents: 0,
    inInstructionData: 0,
    total: 0,
    ...overrides,
});

test('it counts the amount of times defined types are used within the tree', () => {
    // Given the following tree.
    const node = programNode({
        accounts: [
            accountNode({
                data: structTypeNode([
                    structFieldTypeNode({ identifier: 'field1', type: definedTypeLinkNode('myStruct') }),
                    structFieldTypeNode({ identifier: 'field2', type: definedTypeLinkNode('myEnum') }),
                ]),
                identifier: 'myAccount',
            }),
        ],
        definedTypes: [
            definedTypeNode({ identifier: 'myStruct', type: structTypeNode([]) }),
            definedTypeNode({ identifier: 'myEnum', type: enumTypeNode([]) }),
        ],
        identifier: 'customProgram',
        instructions: [
            instructionNode({
                data: structTypeNode([
                    structFieldTypeNode({ identifier: 'arg1', type: definedTypeLinkNode('myStruct') }),
                ]),
                identifier: 'myInstruction',
            }),
        ],
        publicKey: '1111',
    });

    // When we get its defined type histogram.
    const histogram = visit(node, getDefinedTypeHistogramVisitor());

    // Then we expect the following histogram.
    expect(histogram).toStrictEqual({
        'customProgram.myEnum': counts({ inAccounts: 1, total: 1 }),
        'customProgram.myStruct': counts({
            directlyAsInstructionData: 1,
            inAccounts: 1,
            inInstructionData: 1,
            total: 2,
        }),
    });
});

test('it counts defined types used inside event payloads', () => {
    // Given an event whose data uses a defined type.
    const node = programNode({
        definedTypes: [definedTypeNode({ identifier: 'eventPayload', type: structTypeNode([]) })],
        events: [
            eventNode({
                data: structTypeNode([
                    structFieldTypeNode({ identifier: 'payload', type: definedTypeLinkNode('eventPayload') }),
                ]),
                identifier: 'payloadCreated',
            }),
        ],
        identifier: 'customProgram',
        publicKey: '1111',
    });

    // When we get its defined type histogram, then the use is counted as an event use.
    expect(visit(node, getDefinedTypeHistogramVisitor())).toStrictEqual({
        'customProgram.eventPayload': counts({ inEvents: 1, total: 1 }),
    });
});

test('it counts instruction data that is itself a link as a direct use', () => {
    // Given an instruction whose data is a link, and a link nested deeper in another instruction's data.
    const node = programNode({
        definedTypes: [
            definedTypeNode({ identifier: 'argsA', type: structTypeNode([]) }),
            definedTypeNode({ identifier: 'argsB', type: structTypeNode([]) }),
        ],
        identifier: 'customProgram',
        instructions: [
            instructionNode({ data: definedTypeLinkNode('argsA'), identifier: 'instructionA' }),
            instructionNode({
                data: structTypeNode([
                    structFieldTypeNode({
                        identifier: 'nested',
                        type: structTypeNode([
                            structFieldTypeNode({ identifier: 'args', type: definedTypeLinkNode('argsB') }),
                        ]),
                    }),
                ]),
                identifier: 'instructionB',
            }),
        ],
        publicKey: '1111',
    });

    // When we get its defined type histogram.
    const histogram = visit(node, getDefinedTypeHistogramVisitor());

    // Then only the first link is a direct use.
    expect(histogram).toStrictEqual({
        'customProgram.argsA': counts({ directlyAsInstructionData: 1, inInstructionData: 1, total: 1 }),
        'customProgram.argsB': counts({ inInstructionData: 1, total: 1 }),
    });
});

test('it counts uses outside of data in the total only', () => {
    // Given a defined type used in an instruction account default value and a PDA seed.
    const node = programNode({
        definedTypes: [definedTypeNode({ identifier: 'myEnum', type: enumTypeNode([]) })],
        identifier: 'customProgram',
        instructions: [
            instructionNode({
                accounts: [
                    instructionAccountNode({
                        defaultValue: enumValueNode(definedTypeLinkNode('myEnum'), 'a'),
                        identifier: 'myAccount',
                        isSigner: false,
                        isWritable: false,
                    }),
                ],
                identifier: 'myInstruction',
            }),
        ],
        pdas: [
            pdaNode({
                identifier: 'myPda',
                seeds: [
                    constantPdaSeedNode(
                        definedTypeLinkNode('myEnum'),
                        enumValueNode(definedTypeLinkNode('myEnum'), 'a'),
                    ),
                ],
            }),
        ],
        publicKey: '1111',
    });

    // When we get its defined type histogram, then every use counts towards the total.
    expect(visit(node, getDefinedTypeHistogramVisitor())).toStrictEqual({
        'customProgram.myEnum': counts({ total: 3 }),
    });
});

test('it keys links by the program they point to', () => {
    // Given a program linking to a defined type of another program.
    const programA = programNode({
        accounts: [
            accountNode({
                data: definedTypeLinkNode('myType', { program: programLinkNode('programB') }),
                identifier: 'myAccount',
            }),
        ],
        identifier: 'programA',
        publicKey: '1111',
    });
    const programB = programNode({
        definedTypes: [definedTypeNode({ identifier: 'myType', type: integerTypeNode('u8') })],
        identifier: 'programB',
        publicKey: '2222',
    });

    // When we get its defined type histogram.
    const histogram = visit(rootNode(programA, { additionalPrograms: [programB] }), getDefinedTypeHistogramVisitor());

    // Then the use is keyed by the target program.
    expect(histogram).toStrictEqual({ 'programB.myType': counts({ inAccounts: 1, total: 1 }) });
});

test('it counts links from different programs separately', () => {
    // Given two programs with same-named defined types used in other types.
    const programA = programNode({
        definedTypes: [
            definedTypeNode({ identifier: 'myType', type: integerTypeNode('u8') }),
            definedTypeNode({ identifier: 'myCopyType', type: definedTypeLinkNode('myType') }),
        ],
        identifier: 'programA',
        publicKey: '1111',
    });
    const programB = programNode({
        definedTypes: [
            definedTypeNode({ identifier: 'myType', type: integerTypeNode('u16') }),
            definedTypeNode({ identifier: 'myCopyType', type: definedTypeLinkNode('myType') }),
        ],
        identifier: 'programB',
        publicKey: '2222',
    });

    // When we get the defined type histogram of both.
    const histogram = visit(rootNode(programA, { additionalPrograms: [programB] }), getDefinedTypeHistogramVisitor());

    // Then we expect them to be counted separately.
    expect(histogram).toStrictEqual({
        'programA.myType': counts({ inDefinedTypes: 1, total: 1 }),
        'programB.myType': counts({ inDefinedTypes: 1, total: 1 }),
    });
});
