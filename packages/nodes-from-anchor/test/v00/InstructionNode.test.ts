import {
    bytesTypeNode,
    bytesValueNode,
    fieldDiscriminatorNode,
    fixedSizeTransformNode,
    instructionAccountNode,
    instructionNode,
    integerTypeNode,
    integerValueNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { instructionNodeFromAnchorV00 } from '../../src';

test('it creates instruction nodes', () => {
    // When we convert an Anchor instruction without origin.
    const node = instructionNodeFromAnchorV00(
        {
            accounts: [{ isMut: true, isSigner: false, name: 'mint' }],
            args: [{ name: 'amount', type: 'u8' }],
            docs: ['Mint tokens.'],
            name: 'mint_tokens',
        },
        0,
    );

    // Then we expect an instruction node whose data contains its arguments.
    expect(node).toEqual(
        instructionNode({
            accounts: [instructionAccountNode({ identifier: 'mint', isSigner: false, isWritable: true })],
            data: structTypeNode([structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u8') })]),
            docs: 'Mint tokens.',
            identifier: 'mint_tokens',
        }),
    );
});

test('it creates instruction nodes with anchor discriminators', () => {
    // When we convert an Anchor instruction with an Anchor origin.
    const node = instructionNodeFromAnchorV00(
        {
            accounts: [],
            args: [],
            name: 'my_instruction',
        },
        0,
        'anchor',
    );

    // Then we expect a discriminator field to be the first data field.
    expect(node).toEqual(
        instructionNode({
            data: structTypeNode([
                structFieldTypeNode({
                    defaultValue: bytesValueNode('base16', 'c3f1b80e7f9b4435'),
                    defaultValueStrategy: 'omitted',
                    identifier: 'discriminator',
                    type: bytesTypeNode({ transforms: [fixedSizeTransformNode(8)] }),
                }),
            ]),
            discriminators: [fieldDiscriminatorNode('discriminator')],
            identifier: 'my_instruction',
        }),
    );
});

test('it creates instruction nodes with shank discriminators', () => {
    // When we convert a Shank instruction at index 10.
    const node = instructionNodeFromAnchorV00(
        {
            accounts: [],
            args: [{ name: 'amount', type: 'u64' }],
            name: 'my_instruction',
        },
        10,
        'shank',
    );

    // Then we expect a one-byte discriminator field encoding the instruction index.
    expect(node).toEqual(
        instructionNode({
            data: structTypeNode([
                structFieldTypeNode({
                    defaultValue: bytesValueNode('base16', '0a'),
                    defaultValueStrategy: 'omitted',
                    identifier: 'discriminator',
                    type: bytesTypeNode({ transforms: [fixedSizeTransformNode(1)] }),
                }),
                structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') }),
            ]),
            discriminators: [fieldDiscriminatorNode('discriminator')],
            identifier: 'my_instruction',
        }),
    );
});

test('it creates instruction nodes with explicit discriminants', () => {
    // When we convert an instruction with an explicit discriminant.
    const node = instructionNodeFromAnchorV00(
        {
            accounts: [],
            args: [],
            discriminant: { type: 'u32', value: 42 },
            name: 'my_instruction',
        },
        0,
        'shank',
    );

    // Then we expect the discriminant to take precedence over the Shank index.
    expect(node).toEqual(
        instructionNode({
            data: structTypeNode([
                structFieldTypeNode({
                    defaultValue: integerValueNode('42'),
                    defaultValueStrategy: 'omitted',
                    identifier: 'discriminator',
                    type: integerTypeNode('u32'),
                }),
            ]),
            discriminators: [fieldDiscriminatorNode('discriminator')],
            identifier: 'my_instruction',
        }),
    );
});
