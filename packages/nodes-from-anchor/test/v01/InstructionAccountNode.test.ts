import {
    accountNode,
    accountValueNode,
    argumentValueNode,
    constantPdaSeedNodeFromBytes,
    instructionAccountNode,
    instructionArgumentNode,
    numberTypeNode,
    pdaNode,
    pdaSeedValueNode,
    pdaValueNode,
    publicKeyTypeNode,
    publicKeyValueNode,
    sizePrefixTypeNode,
    structFieldTypeNode,
    structTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { instructionAccountNodeFromAnchorV01, instructionAccountNodesFromAnchorV01 } from '../../src';

test('it creates instruction account nodes', () => {
    const node = instructionAccountNodeFromAnchorV01(
        [],
        [],
        {
            docs: ['my docs'],
            name: 'MyInstructionAccount',
            optional: true,
            signer: false,
            writable: true,
        },
        [],
    );

    expect(node).toEqual(
        instructionAccountNode({
            docs: ['my docs'],
            isOptional: true,
            isSigner: false,
            isWritable: true,
            name: 'myInstructionAccount',
        }),
    );
});

test('it flattens nested instruction accounts', () => {
    const nodes = instructionAccountNodesFromAnchorV01(
        [],
        [
            instructionArgumentNode({
                name: 'amount',
                type: numberTypeNode('u8'),
            }),
        ],
        [
            { name: 'accountA', signer: false, writable: false },
            {
                accounts: [
                    {
                        name: 'account_b',
                        signer: false,
                        writable: true,
                    },
                    {
                        name: 'account_c',
                        pda: {
                            seeds: [
                                {
                                    kind: 'const',
                                    value: [0, 1, 2, 3],
                                },
                                {
                                    kind: 'account',
                                    path: 'account_b',
                                },
                                {
                                    kind: 'arg',
                                    path: 'amount',
                                },
                            ],
                        },
                        signer: true,
                        writable: false,
                    },
                    {
                        address: '11111111111111111111111111111111',
                        name: 'system_program',
                    },
                ],
                name: 'nested',
            },
            { name: 'account_d', signer: true, writable: true },
        ],
    );

    expect(nodes).toEqual([
        instructionAccountNode({ isSigner: false, isWritable: false, name: 'accountA' }),
        instructionAccountNode({ isSigner: false, isWritable: true, name: 'accountB' }),
        instructionAccountNode({
            defaultValue: pdaValueNode(
                pdaNode({
                    name: 'accountC',
                    seeds: [
                        constantPdaSeedNodeFromBytes('base16', '00010203'),
                        variablePdaSeedNode('accountB', publicKeyTypeNode()),
                        variablePdaSeedNode('amount', numberTypeNode('u8')),
                    ],
                }),
                [
                    pdaSeedValueNode('accountB', accountValueNode('accountB')),
                    pdaSeedValueNode('amount', argumentValueNode('amount')),
                ],
            ),
            isSigner: true,
            isWritable: false,
            name: 'accountC',
        }),
        instructionAccountNode({
            defaultValue: publicKeyValueNode('11111111111111111111111111111111', 'systemProgram'),
            isSigner: false,
            isWritable: false,
            name: 'systemProgram',
        }),
        instructionAccountNode({ isSigner: true, isWritable: true, name: 'accountD' }),
    ]);
});

test('it ignores PDA default values if at least one seed as a path of length greater than 1', () => {
    const nodes = instructionAccountNodesFromAnchorV01(
        [
            accountNode({
                data: sizePrefixTypeNode(
                    structTypeNode([structFieldTypeNode({ name: 'authority', type: publicKeyTypeNode() })]),
                    numberTypeNode('u32'),
                ),
                name: 'mint',
            }),
        ],
        [],
        [
            {
                name: 'somePdaAccount',
                pda: {
                    seeds: [
                        {
                            account: 'mint',
                            kind: 'account',
                            path: 'mint.authority',
                        },
                    ],
                },
                signer: false,
                writable: false,
            },
        ],
    );

    expect(nodes).toEqual([
        instructionAccountNode({
            isSigner: false,
            isWritable: false,
            name: 'somePdaAccount',
        }),
    ]);
});

test('it handles PDAs with a constant program id', () => {
    const nodes = instructionAccountNodesFromAnchorV01(
        [],
        [],
        [
            {
                name: 'program_data',
                pda: {
                    program: {
                        kind: 'const',
                        value: [
                            2, 168, 246, 145, 78, 136, 161, 176, 226, 16, 21, 62, 247, 99, 174, 43, 0, 194, 185, 61, 22,
                            193, 36, 210, 192, 83, 122, 16, 4, 128, 0, 0,
                        ],
                    },
                    seeds: [
                        {
                            kind: 'const',
                            value: [
                                166, 175, 151, 238, 166, 67, 87, 148, 114, 209, 13, 88, 186, 228, 206, 197, 182, 71,
                                129, 195, 206, 236, 229, 223, 184, 60, 97, 249, 63, 92, 203, 27,
                            ],
                        },
                    ],
                },
            },
        ],
    );

    expect(nodes).toEqual([
        instructionAccountNode({
            defaultValue: pdaValueNode(
                pdaNode({
                    name: 'programData',
                    programId: 'BPFLoaderUpgradeab1e11111111111111111111111',
                    seeds: [
                        constantPdaSeedNodeFromBytes(
                            'base16',
                            'a6af97eea643579472d10d58bae4cec5b64781c3ceece5dfb83c61f93f5ccb1b',
                        ),
                    ],
                }),
                [],
            ),
            isSigner: false,
            isWritable: false,
            name: 'programData',
        }),
    ]);
});

test.skip('it handles account data paths of length 2', () => {
    const nodes = instructionAccountNodesFromAnchorV01(
        [
            accountNode({
                data: sizePrefixTypeNode(
                    structTypeNode([structFieldTypeNode({ name: 'authority', type: publicKeyTypeNode() })]),
                    numberTypeNode('u32'),
                ),
                name: 'mint',
            }),
        ],
        [],
        [
            {
                name: 'somePdaAccount',
                pda: {
                    seeds: [
                        {
                            account: 'mint',
                            kind: 'account',
                            path: 'mint.authority',
                        },
                    ],
                },
                signer: false,
                writable: false,
            },
        ],
    );

    expect(nodes).toEqual([
        instructionAccountNode({
            defaultValue: pdaValueNode(
                pdaNode({
                    name: 'somePdaAccount',
                    seeds: [variablePdaSeedNode('mintAuthority', publicKeyTypeNode())],
                }),
                [],
            ),
            isSigner: false,
            isWritable: false,
            name: 'somePdaAccount',
        }),
    ]);
});
