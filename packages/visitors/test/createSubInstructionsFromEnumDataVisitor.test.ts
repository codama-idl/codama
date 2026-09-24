import {
    CODAMA_ERROR__LINKED_NODE_NOT_FOUND,
    CODAMA_ERROR__VISITORS__INSTRUCTION_ENUM_DATA_FIELD_NOT_FOUND,
    CodamaError,
    isCodamaError,
} from '@codama/errors';
import {
    assertIsNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumTypeNode,
    enumVariantTypeNode,
    fixedSizeTransformNode,
    identifierString,
    instructionNode,
    IntegerTypeNode,
    integerTypeNode,
    integerValueNode,
    pluginNode,
    programNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { createSubInstructionsFromEnumDataVisitor } from '../src';

const u8Field = (identifier: string) => structFieldTypeNode({ identifier, type: integerTypeNode('u8') });
const discriminatorField = (identifier: string, value: string, size: IntegerTypeNode = integerTypeNode('u8')) =>
    structFieldTypeNode({
        defaultValue: integerValueNode(value),
        defaultValueStrategy: 'omitted',
        identifier,
        type: size,
    });

const actionEnum = enumTypeNode(
    [
        enumVariantTypeNode('stop'),
        enumVariantTypeNode('move', { data: structTypeNode([u8Field('x'), u8Field('y')]) }),
        enumVariantTypeNode('wait', { data: integerTypeNode('u64'), discriminator: 5 }),
    ],
    { size: integerTypeNode('u16') },
);

const program = (instruction: ReturnType<typeof instructionNode>) =>
    programNode({
        definedTypes: [definedTypeNode({ identifier: 'action', type: actionEnum })],
        identifier: 'myProgram',
        instructions: [instruction],
        publicKey: '1111',
    });

test('it creates a sub-instruction per enum variant', () => {
    // Given an instruction whose data contains a linked enum between two fields.
    const node = program(
        instructionNode({
            data: structTypeNode([
                u8Field('before'),
                structFieldTypeNode({ identifier: 'action', type: definedTypeLinkNode('action') }),
                u8Field('after'),
            ]),
            identifier: 'act',
        }),
    );

    // When we create sub-instructions from the enum field.
    const result = visit(node, createSubInstructionsFromEnumDataVisitor({ act: 'action' }));

    // Then we get one sub-instruction per variant, discriminated using the enum's size.
    assertIsNode(result, 'programNode');
    const subInstructions = result.instructions?.[0].subInstructions ?? [];
    expect(subInstructions.map(ix => ix.identifier)).toStrictEqual(['act_stop', 'act_move', 'act_wait']);
    expect(subInstructions.map(ix => ix.data)).toStrictEqual([
        structTypeNode([
            u8Field('before'),
            discriminatorField('act_stop_discriminator', '0', integerTypeNode('u16')),
            u8Field('after'),
        ]),
        structTypeNode([
            u8Field('before'),
            discriminatorField('act_move_discriminator', '1', integerTypeNode('u16')),
            u8Field('x'),
            u8Field('y'),
            u8Field('after'),
        ]),
        structTypeNode([
            u8Field('before'),
            discriminatorField('act_wait_discriminator', '5', integerTypeNode('u16')),
            structFieldTypeNode({ identifier: 'action', type: integerTypeNode('u64') }),
            u8Field('after'),
        ]),
    ]);
});

test('it keeps the discriminator and payload grouped when the enum has transforms', () => {
    // Given an instruction whose enum field is fixed-size.
    const node = instructionNode({
        data: structTypeNode([
            structFieldTypeNode({
                identifier: 'action',
                type: enumTypeNode([enumVariantTypeNode('move', { data: integerTypeNode('u8') })], {
                    size: integerTypeNode('u8'),
                    transforms: [fixedSizeTransformNode(4)],
                }),
            }),
        ]),
        identifier: 'act',
    });

    // When we create sub-instructions from the enum field.
    const result = visit(node, createSubInstructionsFromEnumDataVisitor({ act: 'action' }));

    // Then the sub-instruction keeps them in a fixed-size struct.
    assertIsNode(result, 'instructionNode');
    expect(result.subInstructions?.[0].data).toStrictEqual(
        structTypeNode([
            structFieldTypeNode({
                identifier: 'action',
                type: structTypeNode(
                    [
                        discriminatorField('act_move_discriminator', '0'),
                        structFieldTypeNode({ identifier: 'action', type: integerTypeNode('u8') }),
                    ],
                    { transforms: [fixedSizeTransformNode(4)] },
                ),
            }),
        ]),
    );
});

test('it does not copy existing sub-instructions into the new ones', () => {
    // Given an instruction that already has a sub-instruction.
    const existing = instructionNode({ identifier: 'existing' });
    const node = program(
        instructionNode({
            data: structTypeNode([structFieldTypeNode({ identifier: 'action', type: definedTypeLinkNode('action') })]),
            identifier: 'act',
            subInstructions: [existing],
        }),
    );

    // When we create sub-instructions from the enum field.
    const result = visit(node, createSubInstructionsFromEnumDataVisitor({ act: 'action' }));

    // Then the existing sub-instruction is kept on the parent only.
    assertIsNode(result, 'programNode');
    const subInstructions = result.instructions?.[0].subInstructions ?? [];
    expect(subInstructions[0]).toStrictEqual(existing);
    expect(subInstructions.slice(1).every(ix => ix.subInstructions === undefined)).toBe(true);
});

test('it throws when the field is missing or not an enum', () => {
    // Given an instruction without an enum field.
    const node = instructionNode({ data: structTypeNode([u8Field('amount')]), identifier: 'act' });

    // When we create sub-instructions from a missing or non-enum field, then we expect errors.
    ['action', 'amount'].forEach(fieldName =>
        expect(() => visit(node, createSubInstructionsFromEnumDataVisitor({ act: fieldName }))).toThrow(
            new CodamaError(CODAMA_ERROR__VISITORS__INSTRUCTION_ENUM_DATA_FIELD_NOT_FOUND, {
                fieldName: identifierString(fieldName),
                instruction: node,
                instructionName: identifierString('act'),
            }),
        ),
    );
});

test('it keeps the plugins of the enum field on the payload field', () => {
    // Given an enum field carrying plugins.
    const node = instructionNode({
        data: structTypeNode([
            structFieldTypeNode({
                identifier: 'action',
                plugins: [pluginNode('my.plugin')],
                type: enumTypeNode([enumVariantTypeNode('wait', { data: integerTypeNode('u64') })]),
            }),
        ]),
        identifier: 'act',
    });

    // When we create sub-instructions from the enum field.
    const result = visit(node, createSubInstructionsFromEnumDataVisitor({ act: 'action' }));

    // Then the payload field keeps its plugins.
    assertIsNode(result, 'instructionNode');
    expect(result.subInstructions?.[0].data).toStrictEqual(
        structTypeNode([
            discriminatorField('act_wait_discriminator', '0'),
            structFieldTypeNode({
                identifier: 'action',
                plugins: [pluginNode('my.plugin')],
                type: integerTypeNode('u64'),
            }),
        ]),
    );
});

test('it throws when the instruction data links to a missing defined type', () => {
    // Given an instruction whose data links to a defined type that does not exist.
    const node = programNode({
        identifier: 'myProgram',
        instructions: [instructionNode({ data: definedTypeLinkNode('missing'), identifier: 'act' })],
        publicKey: '1111',
    });

    // When we create sub-instructions from it.
    let error: unknown;
    try {
        visit(node, createSubInstructionsFromEnumDataVisitor({ act: 'action' }));
    } catch (e) {
        error = e;
    }

    // Then we expect a linked node error rather than a missing field error.
    expect(isCodamaError(error, CODAMA_ERROR__LINKED_NODE_NOT_FOUND)).toBe(true);
});
