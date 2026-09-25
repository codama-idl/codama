import {
    bytesTypeNode,
    fieldDiscriminatorNode,
    fixedSizeTransformNode,
    instructionAccountNode,
    instructionNode,
    integerTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { GenericsV01, getAnchorDiscriminatorV01, instructionNodeFromAnchorV01 } from '../../src';

const generics = {} as GenericsV01;
const discriminatorField = structFieldTypeNode({
    defaultValue: getAnchorDiscriminatorV01([246, 28, 6, 87, 251, 45, 50, 42]),
    defaultValueStrategy: 'omitted',
    identifier: 'discriminator',
    type: bytesTypeNode({ transforms: [fixedSizeTransformNode(8)] }),
});

test('it creates instruction nodes', () => {
    const node = instructionNodeFromAnchorV01(
        {
            accounts: [
                {
                    name: 'distribution',
                    pda: {
                        seeds: [
                            { kind: 'const', value: [42, 31, 29] },
                            { account: 'Distribution', kind: 'account', path: 'distribution.group_mint' },
                        ],
                    },
                    signer: false,
                    writable: true,
                },
            ],
            args: [{ name: 'amount', type: 'u8' }],
            discriminator: [246, 28, 6, 87, 251, 45, 50, 42],
            name: 'mintTokens',
        },
        generics,
    );

    expect(node).toEqual(
        instructionNode({
            accounts: [
                instructionAccountNode({
                    // TODO: Handle seeds with nested paths. (Needs a path in the IDL but should we?)
                    // defaultValue: pdaValueNode(
                    //     pdaNode({
                    //         identifier: 'distribution',
                    //         seeds: [
                    //             constantPdaSeedNodeFromBytes('base58', 'F9bS'),
                    //             variablePdaSeedNode('distribution_group_mint', publicKeyTypeNode()),
                    //         ],
                    //     }),
                    //     {
                    //         seeds: [
                    //             pdaSeedValueNode(
                    //                 'distribution_group_mint',
                    //                 accountValueNode('distribution', 'group_mint'),
                    //             ),
                    //         ],
                    //     },
                    // ),
                    identifier: 'distribution',
                    isSigner: false,
                    isWritable: true,
                }),
            ],
            data: structTypeNode([
                discriminatorField,
                structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u8') }),
            ]),
            discriminators: [fieldDiscriminatorNode('discriminator')],
            identifier: 'mintTokens',
        }),
    );
});

test('it creates instruction nodes with anchor discriminators', () => {
    const node = instructionNodeFromAnchorV01(
        {
            accounts: [],
            args: [],
            discriminator: [246, 28, 6, 87, 251, 45, 50, 42],
            name: 'myInstruction',
        },
        generics,
    );

    expect(node).toEqual(
        instructionNode({
            data: structTypeNode([discriminatorField]),
            discriminators: [fieldDiscriminatorNode('discriminator')],
            identifier: 'myInstruction',
        }),
    );
});

test('it keeps the raw casing of instruction and argument identifiers', () => {
    const node = instructionNodeFromAnchorV01(
        {
            accounts: [{ name: 'token_account', signer: false, writable: true }],
            args: [{ docs: ['The amount.', 'In lamports.'], name: 'max_amount', type: 'u64' }],
            discriminator: [246, 28, 6, 87, 251, 45, 50, 42],
            docs: ['My instruction.'],
            name: 'my_instruction',
        },
        generics,
    );

    expect(node).toEqual(
        instructionNode({
            accounts: [instructionAccountNode({ identifier: 'token_account', isSigner: false, isWritable: true })],
            data: structTypeNode([
                discriminatorField,
                structFieldTypeNode({
                    docs: 'The amount.\nIn lamports.',
                    identifier: 'max_amount',
                    type: integerTypeNode('u64'),
                }),
            ]),
            discriminators: [fieldDiscriminatorNode('discriminator')],
            docs: 'My instruction.',
            identifier: 'my_instruction',
        }),
    );
});
