import {
    accountNode,
    bytesTypeNode,
    constantPdaSeedNodeFromBytes,
    fieldDiscriminatorNode,
    fixedSizeTypeNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
    pdaNode,
    pdaValueNode,
    publicKeyTypeNode,
    structFieldTypeNode,
    structTypeNode,
    variablePdaSeedNode,
} from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { getAnchorDiscriminatorV01, instructionNodeFromAnchorV01 } from '../../src';

test('it creates instruction nodes', () => {
    const node = instructionNodeFromAnchorV01(
        [
            accountNode({
                data: structTypeNode([
                    structFieldTypeNode({
                        name: 'groupMint',
                        type: publicKeyTypeNode(),
                    }),
                    structFieldTypeNode({
                        name: 'paymentMint',
                        type: publicKeyTypeNode(),
                    }),
                ]),
                name: 'distribution',
            }),
        ],
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
    );

    expect(node).toEqual(
        instructionNode({
            accounts: [
                instructionAccountNode({
                    defaultValue: pdaValueNode(
                        pdaNode({
                            name: 'distribution',
                            seeds: [
                                constantPdaSeedNodeFromBytes('base16', '2a1f1d'),
                                variablePdaSeedNode('distributionGroupMint', publicKeyTypeNode()),
                            ],
                        }),
                        [],
                    ),
                    isSigner: false,
                    isWritable: true,
                    name: 'distribution',
                }),
            ],
            arguments: [
                instructionArgumentNode({
                    defaultValue: getAnchorDiscriminatorV01([246, 28, 6, 87, 251, 45, 50, 42]),
                    defaultValueStrategy: 'omitted',
                    name: 'discriminator',
                    type: fixedSizeTypeNode(bytesTypeNode(), 8),
                }),
                instructionArgumentNode({ name: 'amount', type: numberTypeNode('u8') }),
            ],
            discriminators: [fieldDiscriminatorNode('discriminator')],
            name: 'mintTokens',
        }),
    );
});

test('it creates instruction nodes with anchor discriminators', () => {
    const node = instructionNodeFromAnchorV01([], {
        accounts: [],
        args: [],
        discriminator: [246, 28, 6, 87, 251, 45, 50, 42],
        name: 'myInstruction',
    });

    expect(node).toEqual(
        instructionNode({
            arguments: [
                instructionArgumentNode({
                    defaultValue: getAnchorDiscriminatorV01([246, 28, 6, 87, 251, 45, 50, 42]),
                    defaultValueStrategy: 'omitted',
                    name: 'discriminator',
                    type: fixedSizeTypeNode(bytesTypeNode(), 8),
                }),
            ],
            discriminators: [fieldDiscriminatorNode('discriminator')],
            name: 'myInstruction',
        }),
    );
});
