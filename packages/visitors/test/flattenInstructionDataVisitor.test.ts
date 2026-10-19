import {
    dataValueNode,
    definedTypeLinkNode,
    fieldDiscriminatorNode,
    instructionAccountNode,
    instructionByteDeltaNode,
    instructionDisplayNode,
    instructionNode,
    integerTypeNode,
    pdaSeedValueNode,
    pdaValueNode,
    providedNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { flattenInstructionDataVisitor } from '../src';

const u8Field = (identifier: string) => structFieldTypeNode({ identifier, type: integerTypeNode('u8') });
const structField = (identifier: string, fields: ReturnType<typeof structFieldTypeNode>[]) =>
    structFieldTypeNode({ identifier, type: structTypeNode(fields) });
const pdaAccount = (path: string) =>
    instructionAccountNode({
        defaultValue: pdaValueNode('myPda', { seeds: [pdaSeedValueNode('seed', dataValueNode(path))] }),
        identifier: 'pda',
        isSigner: false,
        isWritable: false,
    });

test('it flattens the struct fields of instruction data', () => {
    // Given an instruction whose data contains a nested struct.
    const node = instructionNode({
        data: structTypeNode([
            u8Field('a'),
            structFieldTypeNode({ identifier: 'args', type: structTypeNode([u8Field('b'), u8Field('c')]) }),
        ]),
        identifier: 'myInstruction',
    });

    // When we flatten its data.
    const result = visit(node, flattenInstructionDataVisitor());

    // Then the nested fields are inlined.
    expect(result).toStrictEqual(
        instructionNode({
            data: structTypeNode([u8Field('a'), u8Field('b'), u8Field('c')]),
            identifier: 'myInstruction',
        }),
    );
});

test('it flattens the data of sub-instructions', () => {
    // Given an instruction with a sub-instruction whose data contains a nested struct.
    const node = instructionNode({
        identifier: 'parent',
        subInstructions: [
            instructionNode({
                data: structTypeNode([
                    structFieldTypeNode({ identifier: 'args', type: structTypeNode([u8Field('a')]) }),
                ]),
                identifier: 'child',
            }),
        ],
    });

    // When we flatten the instruction data.
    const result = visit(node, flattenInstructionDataVisitor());

    // Then the sub-instruction data is flattened too.
    expect(result).toStrictEqual(
        instructionNode({
            identifier: 'parent',
            subInstructions: [instructionNode({ data: structTypeNode([u8Field('a')]), identifier: 'child' })],
        }),
    );
});

test('it leaves linked instruction data untouched', () => {
    // Given an instruction whose data is a link.
    const node = instructionNode({ data: definedTypeLinkNode('myArgs'), identifier: 'myInstruction' });

    // When we flatten its data, then nothing changes.
    expect(visit(node, flattenInstructionDataVisitor())).toStrictEqual(node);
});

test('it repoints data paths going through inlined fields', () => {
    // Given an account whose PDA seed points into a nested struct of the instruction data.
    const node = instructionNode({
        accounts: [pdaAccount('params.seed')],
        data: structTypeNode([structField('params', [u8Field('seed')])]),
        identifier: 'myInstruction',
    });

    // When we flatten its data.
    const result = visit(node, flattenInstructionDataVisitor());

    // Then the seed points to the inlined field.
    expect(result).toStrictEqual(
        instructionNode({
            accounts: [pdaAccount('seed')],
            data: structTypeNode([u8Field('seed')]),
            identifier: 'myInstruction',
        }),
    );
});

test('it repoints deeper data paths going through inlined fields', () => {
    // Given a provided value pointing two levels deep into the instruction data.
    const node = instructionNode({
        data: structTypeNode([structField('params', [structField('inner', [u8Field('value')])])]),
        identifier: 'myInstruction',
        provides: [providedNode('value', dataValueNode('params.inner.value'))],
    });

    // When we flatten its data.
    const result = visit(node, flattenInstructionDataVisitor());

    // Then only the inlined segment is removed from the path.
    expect(result).toStrictEqual(
        instructionNode({
            data: structTypeNode([structField('inner', [u8Field('value')])]),
            identifier: 'myInstruction',
            provides: [providedNode('value', dataValueNode('inner.value'))],
        }),
    );
});

test('it keeps data paths that do not go through inlined fields', () => {
    // Given data paths pointing to a top-level field and into a linked field.
    const node = instructionNode({
        byteDeltas: [instructionByteDeltaNode(dataValueNode('config.space'))],
        data: structTypeNode([
            u8Field('amount'),
            structFieldTypeNode({ identifier: 'config', type: definedTypeLinkNode('config') }),
            structField('params', [u8Field('seed')]),
        ]),
        identifier: 'myInstruction',
        provides: [providedNode('amount', dataValueNode('amount'))],
    });

    // When we flatten its data.
    const result = visit(node, flattenInstructionDataVisitor());

    // Then these paths are unchanged.
    expect(result).toStrictEqual(
        instructionNode({
            ...node,
            data: structTypeNode([
                u8Field('amount'),
                structFieldTypeNode({ identifier: 'config', type: definedTypeLinkNode('config') }),
                u8Field('seed'),
            ]),
        }),
    );
});

test('it repoints the data paths of interpolated intents', () => {
    // Given an interpolated intent with a placeholder pointing into a nested struct.
    const node = instructionNode({
        data: structTypeNode([structField('params', [u8Field('seed')])]),
        display: instructionDisplayNode({ interpolatedIntent: 'Use seed ${data.params.seed}' }),
        identifier: 'myInstruction',
    });

    // When we flatten its data.
    const result = visit(node, flattenInstructionDataVisitor());

    // Then the placeholder points to the inlined field.
    expect(result).toStrictEqual(
        instructionNode({
            data: structTypeNode([u8Field('seed')]),
            display: instructionDisplayNode({ interpolatedIntent: 'Use seed ${data.seed}' }),
            identifier: 'myInstruction',
        }),
    );
});

test('it repoints the paths of field discriminators', () => {
    // Given a field discriminator pointing into a nested struct.
    const node = instructionNode({
        data: structTypeNode([structField('header', [u8Field('discriminator')])]),
        discriminators: [fieldDiscriminatorNode('header.discriminator')],
        identifier: 'myInstruction',
    });

    // When we flatten its data.
    const result = visit(node, flattenInstructionDataVisitor());

    // Then the discriminator points to the inlined field.
    expect(result).toStrictEqual(
        instructionNode({
            data: structTypeNode([u8Field('discriminator')]),
            discriminators: [fieldDiscriminatorNode('discriminator')],
            identifier: 'myInstruction',
        }),
    );
});

test('it repoints the data paths of sub-instructions against their own data', () => {
    // Given a parent whose `params` field is inlined and a sub-instruction whose `params` field is linked.
    const node = instructionNode({
        data: structTypeNode([structField('params', [u8Field('seed')])]),
        identifier: 'parent',
        subInstructions: [
            instructionNode({
                accounts: [pdaAccount('params.seed')],
                data: structTypeNode([
                    structFieldTypeNode({ identifier: 'params', type: definedTypeLinkNode('params') }),
                ]),
                identifier: 'child',
            }),
        ],
    });

    // When we flatten the instruction data.
    const result = visit(node, flattenInstructionDataVisitor());

    // Then the data path of the sub-instruction still refers to its own data.
    expect(result).toStrictEqual(
        instructionNode({
            ...node,
            data: structTypeNode([u8Field('seed')]),
        }),
    );
});

test('it leaves the data unflattened when inlined fields would conflict', () => {
    // Given an instruction whose nested struct has a field sharing the name of a top-level field.
    const node = instructionNode({
        accounts: [pdaAccount('params.amount')],
        data: structTypeNode([u8Field('amount'), structField('params', [u8Field('amount')])]),
        identifier: 'myInstruction',
    });

    // When we flatten its data, then nothing changes.
    expect(visit(node, flattenInstructionDataVisitor())).toStrictEqual(node);
});

test('it leaves the data unflattened when an inlined field is referenced as a whole', () => {
    // Given an instruction whose PDA seed points to a whole nested struct.
    const node = instructionNode({
        accounts: [pdaAccount('params')],
        data: structTypeNode([structField('params', [u8Field('seed')]), structField('other', [u8Field('value')])]),
        identifier: 'myInstruction',
    });

    // When we flatten its data, then nothing changes.
    expect(visit(node, flattenInstructionDataVisitor())).toStrictEqual(node);
});
