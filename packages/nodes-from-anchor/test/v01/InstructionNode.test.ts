import {
    bytesTypeNode,
    fieldDiscriminatorNode,
    fixedSizeTypeNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { GenericsV01, getAnchorDiscriminatorV01, instructionNodeFromAnchorV01 } from '../../src';

const generics = {} as GenericsV01;

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
                    //         name: 'distribution',
                    //         seeds: [
                    //             constantPdaSeedNodeFromBytes('base58', 'F9bS'),
                    //             variablePdaSeedNode('distributionGroupMint', publicKeyTypeNode()),
                    //         ],
                    //     }),
                    //     [pdaSeedValueNode("distributionGroupMint", accountValueNode('distribution', 'group_mint'))],
                    // ),
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
