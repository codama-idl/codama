import {
    definedTypeLinkNode,
    instructionNode,
    integerTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { flattenInstructionDataVisitor } from '../src';

const u8Field = (identifier: string) => structFieldTypeNode({ identifier, type: integerTypeNode('u8') });

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
