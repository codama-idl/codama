import {
    definedTypeLinkNode,
    definedTypeNode,
    instructionNode,
    integerTypeNode,
    programLinkNode,
    programNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getInstructionDataFields, getRecordLinkablesVisitor, LinkableDictionary, visit } from '../src';

test('it lists nested data fields with their paths, following links', () => {
    // Given an instruction whose data nests an inline struct and a linked struct.
    const instruction = instructionNode({
        data: structTypeNode([
            structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') }),
            structFieldTypeNode({
                identifier: 'config',
                type: structTypeNode([structFieldTypeNode({ identifier: 'fee', type: integerTypeNode('u16') })]),
            }),
            structFieldTypeNode({ identifier: 'extra', type: definedTypeLinkNode('extra') }),
        ]),
        identifier: 'myInstruction',
    });
    const program = programNode({
        definedTypes: [
            definedTypeNode({
                identifier: 'extra',
                type: structTypeNode([structFieldTypeNode({ identifier: 'flag', type: integerTypeNode('u8') })]),
            }),
        ],
        identifier: 'myProgram',
        instructions: [instruction],
        publicKey: '1111',
    });
    const linkables = new LinkableDictionary();
    visit(program, getRecordLinkablesVisitor(linkables));

    // When we list its data fields.
    const paths = getInstructionDataFields([program, instruction], linkables).map(({ path }) => path);

    // Then we get every addressable field.
    expect(paths).toStrictEqual(['amount', 'config', 'config.fee', 'extra', 'extra.flag']);
});

test('it follows each defined type at most once', () => {
    // Given an instruction whose data is a self-referencing defined type.
    const instruction = instructionNode({ data: definedTypeLinkNode('node'), identifier: 'myInstruction' });
    const program = programNode({
        definedTypes: [
            definedTypeNode({
                identifier: 'node',
                type: structTypeNode([structFieldTypeNode({ identifier: 'next', type: definedTypeLinkNode('node') })]),
            }),
        ],
        identifier: 'myProgram',
        instructions: [instruction],
        publicKey: '1111',
    });
    const linkables = new LinkableDictionary();
    visit(program, getRecordLinkablesVisitor(linkables));

    // When we list its data fields, then the cycle is not followed.
    expect(getInstructionDataFields([program, instruction], linkables).map(({ path }) => path)).toStrictEqual(['next']);
});

test('it follows same-named defined types from different programs', () => {
    // Given instruction data linking to a type that links to a same-named type of another program.
    const instruction = instructionNode({ data: definedTypeLinkNode('args'), identifier: 'myInstruction' });
    const programA = programNode({
        definedTypes: [
            definedTypeNode({
                identifier: 'args',
                type: structTypeNode([
                    structFieldTypeNode({
                        identifier: 'remote',
                        type: definedTypeLinkNode('args', { program: programLinkNode('programB') }),
                    }),
                ]),
            }),
        ],
        identifier: 'programA',
        instructions: [instruction],
        publicKey: '1111',
    });
    const programB = programNode({
        definedTypes: [
            definedTypeNode({
                identifier: 'args',
                type: structTypeNode([structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') })]),
            }),
        ],
        identifier: 'programB',
        publicKey: '2222',
    });
    const root = rootNode(programA, { additionalPrograms: [programB] });
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    // When we list its data fields, then the fields of both types are listed.
    expect(getInstructionDataFields([root, programA, instruction], linkables).map(({ path }) => path)).toStrictEqual([
        'remote',
        'remote.amount',
    ]);
});
