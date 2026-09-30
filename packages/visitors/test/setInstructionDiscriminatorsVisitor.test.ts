import {
    CODAMA_ERROR__VISITORS__CANNOT_SET_INSTRUCTION_DISCRIMINATOR,
    CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS,
    CodamaError,
} from '@codama/errors';
import {
    assertIsNode,
    constantDiscriminatorNode,
    constantValueNode,
    definedTypeLinkNode,
    definedTypeNode,
    fieldDiscriminatorNode,
    hiddenPrefixTransformNode,
    InstructionNode,
    instructionNode,
    integerTypeNode,
    integerValueNode,
    programNode,
    sizeDiscriminatorNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { setInstructionDiscriminatorsVisitor } from '../src';

const u64Field = (identifier: string) => structFieldTypeNode({ identifier, type: integerTypeNode('u64') });
const discriminatorField = (identifier = 'discriminator', value = '3') =>
    structFieldTypeNode({
        defaultValue: integerValueNode(value),
        defaultValueStrategy: 'omitted',
        identifier,
        type: integerTypeNode('u8'),
    });

test('it adds a discriminator field to inline struct data', () => {
    // Given an instruction with struct data.
    const node = instructionNode({ data: structTypeNode([u64Field('amount')]), identifier: 'transfer' });

    // When we set its discriminator.
    const result = visit(node, setInstructionDiscriminatorsVisitor({ transfer: { value: integerValueNode('3') } }));

    // Then a discriminator field is prepended and discriminates the instruction.
    expect(result).toStrictEqual(
        instructionNode({
            data: structTypeNode([discriminatorField(), u64Field('amount')]),
            discriminators: [fieldDiscriminatorNode('discriminator')],
            identifier: 'transfer',
        }),
    );
});

test('it adds a discriminator field to instructions without data', () => {
    // Given an instruction without data.
    const node = instructionNode({ identifier: 'ping' });

    // When we set its discriminator with a custom identifier.
    const result = visit(
        node,
        setInstructionDiscriminatorsVisitor({ ping: { identifier: 'kind', value: integerValueNode('7') } }),
    );

    // Then the data becomes a struct with the discriminator field.
    expect(result).toStrictEqual(
        instructionNode({
            data: structTypeNode([discriminatorField('kind', '7')]),
            discriminators: [fieldDiscriminatorNode('kind')],
            identifier: 'ping',
        }),
    );
});

test('it adds a hidden prefix to linked data', () => {
    // Given an instruction whose data links to a shared defined type.
    const node = programNode({
        definedTypes: [definedTypeNode({ identifier: 'args', type: structTypeNode([u64Field('amount')]) })],
        identifier: 'myProgram',
        instructions: [instructionNode({ data: definedTypeLinkNode('args'), identifier: 'transfer' })],
        publicKey: '1111',
    });

    // When we set its discriminator.
    const result = visit(node, setInstructionDiscriminatorsVisitor({ transfer: { value: integerValueNode('3') } }));

    // Then the data is prefixed with a hidden constant and the defined type is untouched.
    const constant = constantValueNode(integerTypeNode('u8'), integerValueNode('3'));
    assertIsNode(result, 'programNode');
    expect(result.definedTypes).toStrictEqual(node.definedTypes);
    expect(result.instructions?.[0]).toStrictEqual(
        instructionNode({
            data: definedTypeLinkNode('args', { transforms: [hiddenPrefixTransformNode([constant])] }),
            discriminators: [constantDiscriminatorNode(constant, { offset: 0 })],
            identifier: 'transfer',
        }),
    );
});

test('it shifts existing discriminators by the size of the new one', () => {
    // Given an instruction with field, constant and size discriminators.
    const constant = constantValueNode(integerTypeNode('u16'), integerValueNode('1'));
    const node = instructionNode({
        data: structTypeNode([u64Field('amount')]),
        discriminators: [
            fieldDiscriminatorNode('amount', { offset: 0 }),
            constantDiscriminatorNode(constant, { offset: 2 }),
            sizeDiscriminatorNode(8),
        ],
        identifier: 'transfer',
    });

    // When we set a u32 discriminator.
    const result = visit(
        node,
        setInstructionDiscriminatorsVisitor({
            transfer: { type: integerTypeNode('u32'), value: integerValueNode('3') },
        }),
    );

    // Then the existing discriminators are shifted by 4 bytes.
    assertIsNode(result, 'instructionNode');
    expect(result.discriminators).toStrictEqual([
        fieldDiscriminatorNode('discriminator'),
        fieldDiscriminatorNode('amount', { offset: 4 }),
        constantDiscriminatorNode(constant, { offset: 6 }),
        sizeDiscriminatorNode(12),
    ]);
});

test('it throws when the discriminator cannot be set', () => {
    const withField = instructionNode({ data: structTypeNode([u64Field('discriminator')]), identifier: 'ix' });
    const withLink = instructionNode({ data: definedTypeLinkNode('args'), identifier: 'ix' });
    const value = integerValueNode('3');
    const cannotSet = (instruction: InstructionNode, reason: string) =>
        new CodamaError(CODAMA_ERROR__VISITORS__CANNOT_SET_INSTRUCTION_DISCRIMINATOR, {
            instruction,
            instructionName: instruction.identifier,
            reason,
        });

    // When the identifier already exists in the data.
    expect(() => visit(withField, setInstructionDiscriminatorsVisitor({ ix: { value } }))).toThrow(
        cannotSet(withField, 'the data already has a field named `discriminator`'),
    );

    // When the optional strategy is used with a hidden prefix.
    expect(() => visit(withLink, setInstructionDiscriminatorsVisitor({ ix: { strategy: 'optional', value } }))).toThrow(
        cannotSet(
            withLink,
            'the `optional` strategy is not supported when the discriminator is added as a hidden prefix',
        ),
    );

    // When the discriminator does not have a fixed size.
    expect(() =>
        visit(withField, setInstructionDiscriminatorsVisitor({ ix: { type: stringTypeNode('utf8'), value } })),
    ).toThrow(cannotSet(withField, 'the discriminator type must have a fixed size'));
});

test('it throws on unrecognized keys', () => {
    // When we use the v1 `name` key, then we expect an error when creating the visitor.
    expect(() =>
        setInstructionDiscriminatorsVisitor({ ix: { name: 'kind', value: integerValueNode('3') } as never }),
    ).toThrow(
        new CodamaError(CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS, {
            allowedKeys: ['docs', 'identifier', 'strategy', 'type', 'value'],
            selector: 'ix',
            unrecognizedKeys: ['name'],
        }),
    );
});

test('it adds a hidden prefix to struct data that carries transforms', () => {
    // Given struct data with a hidden prefix discriminated by a constant at offset 0.
    const magic = constantValueNode(integerTypeNode('u8'), integerValueNode('9'));
    const node = instructionNode({
        data: structTypeNode([u64Field('amount')], { transforms: [hiddenPrefixTransformNode([magic])] }),
        discriminators: [constantDiscriminatorNode(magic, { offset: 0 })],
        identifier: 'transfer',
    });

    // When we set its discriminator.
    const result = visit(node, setInstructionDiscriminatorsVisitor({ transfer: { value: integerValueNode('3') } }));

    // Then a new outermost hidden prefix is added and the existing discriminator is shifted after it.
    const constant = constantValueNode(integerTypeNode('u8'), integerValueNode('3'));
    expect(result).toStrictEqual(
        instructionNode({
            data: structTypeNode([u64Field('amount')], {
                transforms: [hiddenPrefixTransformNode([magic]), hiddenPrefixTransformNode([constant])],
            }),
            discriminators: [
                constantDiscriminatorNode(constant, { offset: 0 }),
                constantDiscriminatorNode(magic, { offset: 1 }),
            ],
            identifier: 'transfer',
        }),
    );
});
