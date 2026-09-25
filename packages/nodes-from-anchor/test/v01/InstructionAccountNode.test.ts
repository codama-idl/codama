import {
    accountValueNode,
    constantPdaSeedNodeFromBytes,
    dataValueNode,
    instructionAccountNode,
    integerTypeNode,
    pdaNode,
    pdaSeedValueNode,
    pdaValueNode,
    publicKeyTypeNode,
    publicKeyValueNode,
    structFieldTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import {
    IdlV01InstructionAccountItem,
    instructionAccountNodeFromAnchorV01,
    instructionAccountNodesFromAnchorV01,
} from '../../src';

test('it creates instruction account nodes', () => {
    const node = instructionAccountNodeFromAnchorV01(
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
            docs: 'my docs',
            identifier: 'MyInstructionAccount',
            isOptional: true,
            isSigner: false,
            isWritable: true,
        }),
    );
});

test('it flattens nested instruction accounts without prefixing when no duplicates exist', () => {
    const nodes = instructionAccountNodesFromAnchorV01(
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
        [structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u8') })],
    );

    expect(nodes).toEqual([
        instructionAccountNode({ identifier: 'accountA', isSigner: false, isWritable: false }),
        instructionAccountNode({ identifier: 'account_b', isSigner: false, isWritable: true }),
        instructionAccountNode({
            defaultValue: pdaValueNode(
                pdaNode({
                    identifier: 'account_c',
                    seeds: [
                        constantPdaSeedNodeFromBytes('base58', '1Ldp'),
                        variablePdaSeedNode('account_b', publicKeyTypeNode()),
                        variablePdaSeedNode('amount', integerTypeNode('u8')),
                    ],
                }),
                {
                    seeds: [
                        pdaSeedValueNode('account_b', accountValueNode('account_b')),
                        pdaSeedValueNode('amount', dataValueNode('amount')),
                    ],
                },
            ),
            identifier: 'account_c',
            isSigner: true,
            isWritable: false,
        }),
        instructionAccountNode({
            defaultValue: publicKeyValueNode('11111111111111111111111111111111', { identifier: 'system_program' }),
            identifier: 'system_program',
            isSigner: false,
            isWritable: false,
        }),
        instructionAccountNode({ identifier: 'account_d', isSigner: true, isWritable: true }),
    ]);
});

test('it prevents duplicate names by prefixing nested accounts with different parent names', () => {
    const nodes = instructionAccountNodesFromAnchorV01(
        [
            {
                accounts: [
                    { name: 'mint', signer: false, writable: false },
                    { name: 'authority', signer: true, writable: false },
                ],
                name: 'tokenProgram',
            },
            {
                accounts: [
                    { name: 'mint', signer: false, writable: true },
                    { name: 'metadata', signer: false, writable: true },
                ],
                name: 'nftProgram',
            },
        ],
        [],
    );

    expect(nodes).toEqual([
        instructionAccountNode({ identifier: 'tokenProgram_mint', isSigner: false, isWritable: false }),
        instructionAccountNode({ identifier: 'tokenProgram_authority', isSigner: true, isWritable: false }),
        instructionAccountNode({ identifier: 'nftProgram_mint', isSigner: false, isWritable: true }),
        instructionAccountNode({ identifier: 'nftProgram_metadata', isSigner: false, isWritable: true }),
    ]);
});

test('it handles nested accounts with more complex duplicate scenarios', () => {
    const nodes = instructionAccountNodesFromAnchorV01(
        [
            { name: 'authority', signer: true, writable: false },
            {
                accounts: [
                    { name: 'mint', signer: false, writable: false },
                    { name: 'vault', signer: false, writable: true },
                    { name: 'authority', signer: false, writable: false },
                ],
                name: 'sourceProgram',
            },
            {
                accounts: [
                    { name: 'mint', signer: false, writable: false },
                    { name: 'escrow', signer: false, writable: true },
                    { name: 'metadata', signer: false, writable: true },
                ],
                name: 'destinationProgram',
            },
        ],
        [],
    );

    expect(nodes).toEqual([
        instructionAccountNode({ identifier: 'authority', isSigner: true, isWritable: false }),
        instructionAccountNode({ identifier: 'sourceProgram_mint', isSigner: false, isWritable: false }),
        instructionAccountNode({ identifier: 'sourceProgram_vault', isSigner: false, isWritable: true }),
        instructionAccountNode({ identifier: 'sourceProgram_authority', isSigner: false, isWritable: false }),
        instructionAccountNode({ identifier: 'destinationProgram_mint', isSigner: false, isWritable: false }),
        instructionAccountNode({ identifier: 'destinationProgram_escrow', isSigner: false, isWritable: true }),
        instructionAccountNode({ identifier: 'destinationProgram_metadata', isSigner: false, isWritable: true }),
    ]);
});

test('it handles depth-2 nested accounts with naming conflicts', () => {
    const items = [
        { name: 'authority', signer: true, writable: false },
        {
            accounts: [
                { name: 'mint', signer: false, writable: false },
                { name: 'vault', signer: false, writable: true },
                { name: 'authority', signer: false, writable: false },
                {
                    accounts: [
                        { name: 'authority', signer: false, writable: true },
                        { name: 'mint', signer: false, writable: false },
                    ],
                    name: 'deepProgram',
                },
            ],
            name: 'sourceProgram',
        },
        {
            accounts: [
                { name: 'mint', signer: false, writable: false },
                { name: 'escrow', signer: false, writable: true },
                { name: 'metadata', signer: false, writable: true },
            ],
            name: 'destinationProgram',
        },
    ] as unknown as IdlV01InstructionAccountItem[];

    const nodes = instructionAccountNodesFromAnchorV01(items, []);

    expect(nodes).toEqual([
        instructionAccountNode({ identifier: 'authority', isSigner: true, isWritable: false }),
        instructionAccountNode({ identifier: 'sourceProgram_mint', isSigner: false, isWritable: false }),
        instructionAccountNode({ identifier: 'sourceProgram_vault', isSigner: false, isWritable: true }),
        instructionAccountNode({ identifier: 'sourceProgram_authority', isSigner: false, isWritable: false }),
        instructionAccountNode({
            identifier: 'sourceProgram_deepProgram_authority',
            isSigner: false,
            isWritable: true,
        }),
        instructionAccountNode({ identifier: 'sourceProgram_deepProgram_mint', isSigner: false, isWritable: false }),
        instructionAccountNode({ identifier: 'destinationProgram_mint', isSigner: false, isWritable: false }),
        instructionAccountNode({ identifier: 'destinationProgram_escrow', isSigner: false, isWritable: true }),
        instructionAccountNode({ identifier: 'destinationProgram_metadata', isSigner: false, isWritable: true }),
    ]);
});

test('it correctly prefixes PDA seed account references in nested groups', () => {
    const nodes = instructionAccountNodesFromAnchorV01(
        [
            {
                accounts: [
                    { name: 'mint', signer: false, writable: false },
                    {
                        name: 'vault',
                        pda: {
                            seeds: [{ kind: 'account', path: 'mint' }],
                        },
                        signer: false,
                        writable: true,
                    },
                ],
                name: 'tokenProgram',
            },
            {
                accounts: [
                    { name: 'mint', signer: false, writable: false },
                    {
                        name: 'escrow',
                        pda: {
                            seeds: [{ kind: 'account', path: 'mint' }],
                        },
                        signer: false,
                        writable: true,
                    },
                ],
                name: 'nftProgram',
            },
        ],
        [],
    );

    expect(nodes).toEqual([
        instructionAccountNode({ identifier: 'tokenProgram_mint', isSigner: false, isWritable: false }),
        instructionAccountNode({
            defaultValue: pdaValueNode(
                pdaNode({
                    identifier: 'tokenProgram_vault',
                    seeds: [variablePdaSeedNode('tokenProgram_mint', publicKeyTypeNode())],
                }),
                { seeds: [pdaSeedValueNode('tokenProgram_mint', accountValueNode('tokenProgram_mint'))] },
            ),
            identifier: 'tokenProgram_vault',
            isSigner: false,
            isWritable: true,
        }),
        instructionAccountNode({ identifier: 'nftProgram_mint', isSigner: false, isWritable: false }),
        instructionAccountNode({
            defaultValue: pdaValueNode(
                pdaNode({
                    identifier: 'nftProgram_escrow',
                    seeds: [variablePdaSeedNode('nftProgram_mint', publicKeyTypeNode())],
                }),
                { seeds: [pdaSeedValueNode('nftProgram_mint', accountValueNode('nftProgram_mint'))] },
            ),
            identifier: 'nftProgram_escrow',
            isSigner: false,
            isWritable: true,
        }),
    ]);
});

test('it ignores PDA default values if at least one seed as a path of length greater than 1', () => {
    const nodes = instructionAccountNodesFromAnchorV01(
        // [
        //     accountNode({
        //         data: structTypeNode([structFieldTypeNode({ identifier: 'authority', type: publicKeyTypeNode() })], {
        //             transforms: [sizePrefixTransformNode(integerTypeNode('u32'))],
        //         }),
        //         identifier: 'mint',
        //     }),
        // ],
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
        [],
    );

    expect(nodes).toEqual([
        instructionAccountNode({
            identifier: 'somePdaAccount',
            isSigner: false,
            isWritable: false,
        }),
    ]);
});

test('it handles PDAs with a constant program id', () => {
    const nodes = instructionAccountNodesFromAnchorV01(
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
        [],
    );

    expect(nodes).toEqual([
        instructionAccountNode({
            defaultValue: pdaValueNode(
                pdaNode({
                    identifier: 'program_data',
                    programId: 'BPFLoaderUpgradeab1e11111111111111111111111',
                    seeds: [constantPdaSeedNodeFromBytes('base58', 'CDfyUBS8ZuL1L3kEy6mHVyAx1s9E97KNAwTfMfvhCriN')],
                }),
            ),
            identifier: 'program_data',
            isSigner: false,
            isWritable: false,
        }),
    ]);
});

test('it handles PDAs with a program id that points to another account', () => {
    const nodes = instructionAccountNodesFromAnchorV01(
        [
            {
                name: 'my_pda',
                pda: {
                    program: { kind: 'account', path: 'my_program' },
                    seeds: [],
                },
            },
        ],
        [],
    );

    expect(nodes).toEqual([
        instructionAccountNode({
            defaultValue: pdaValueNode(
                pdaNode({
                    identifier: 'my_pda',
                }),
                { programId: accountValueNode('my_program') },
            ),
            identifier: 'my_pda',
            isSigner: false,
            isWritable: false,
        }),
    ]);
});

test.skip('it handles account data paths of length 2', () => {
    const nodes = instructionAccountNodesFromAnchorV01(
        // [
        //     accountNode({
        //         data: structTypeNode([structFieldTypeNode({ identifier: 'authority', type: publicKeyTypeNode() })], {
        //             transforms: [sizePrefixTransformNode(integerTypeNode('u32'))],
        //         }),
        //         identifier: 'mint',
        //     }),
        // ],
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
        [],
    );

    expect(nodes).toEqual([
        instructionAccountNode({
            defaultValue: pdaValueNode(
                pdaNode({
                    identifier: 'somePdaAccount',
                    seeds: [variablePdaSeedNode('mint_authority', publicKeyTypeNode())],
                }),
            ),
            identifier: 'somePdaAccount',
            isSigner: false,
            isWritable: false,
        }),
    ]);
});
