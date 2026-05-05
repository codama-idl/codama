import {
    accountValueNode,
    argumentValueNode,
    constantPdaSeedNodeFromBytes,
    definedTypeLinkNode,
    instructionAccountNode,
    instructionArgumentNode,
    numberTypeNode,
    pdaNode,
    pdaSeedValueNode,
    pdaValueNode,
    publicKeyTypeNode,
    publicKeyValueNode,
    structFieldTypeNode,
    structTypeNode,
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
            docs: ['my docs'],
            isOptional: true,
            isSigner: false,
            isWritable: true,
            name: 'myInstructionAccount',
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
        [instructionArgumentNode({ name: 'amount', type: numberTypeNode('u8') })],
    );

    expect(nodes).toEqual([
        instructionAccountNode({ isSigner: false, isWritable: false, name: 'accountA' }),
        instructionAccountNode({ isSigner: false, isWritable: true, name: 'accountB' }),
        instructionAccountNode({
            defaultValue: pdaValueNode(
                pdaNode({
                    name: 'accountC',
                    seeds: [
                        constantPdaSeedNodeFromBytes('base58', '1Ldp'),
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
        instructionAccountNode({ isSigner: false, isWritable: false, name: 'tokenProgramMint' }),
        instructionAccountNode({ isSigner: true, isWritable: false, name: 'tokenProgramAuthority' }),
        instructionAccountNode({ isSigner: false, isWritable: true, name: 'nftProgramMint' }),
        instructionAccountNode({ isSigner: false, isWritable: true, name: 'nftProgramMetadata' }),
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
        instructionAccountNode({ isSigner: true, isWritable: false, name: 'authority' }),
        instructionAccountNode({ isSigner: false, isWritable: false, name: 'sourceProgramMint' }),
        instructionAccountNode({ isSigner: false, isWritable: true, name: 'sourceProgramVault' }),
        instructionAccountNode({ isSigner: false, isWritable: false, name: 'sourceProgramAuthority' }),
        instructionAccountNode({ isSigner: false, isWritable: false, name: 'destinationProgramMint' }),
        instructionAccountNode({ isSigner: false, isWritable: true, name: 'destinationProgramEscrow' }),
        instructionAccountNode({ isSigner: false, isWritable: true, name: 'destinationProgramMetadata' }),
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
        instructionAccountNode({ isSigner: true, isWritable: false, name: 'authority' }),
        instructionAccountNode({ isSigner: false, isWritable: false, name: 'sourceProgramMint' }),
        instructionAccountNode({ isSigner: false, isWritable: true, name: 'sourceProgramVault' }),
        instructionAccountNode({ isSigner: false, isWritable: false, name: 'sourceProgramAuthority' }),
        instructionAccountNode({ isSigner: false, isWritable: true, name: 'sourceProgramDeepProgramAuthority' }),
        instructionAccountNode({ isSigner: false, isWritable: false, name: 'sourceProgramDeepProgramMint' }),
        instructionAccountNode({ isSigner: false, isWritable: false, name: 'destinationProgramMint' }),
        instructionAccountNode({ isSigner: false, isWritable: true, name: 'destinationProgramEscrow' }),
        instructionAccountNode({ isSigner: false, isWritable: true, name: 'destinationProgramMetadata' }),
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
        instructionAccountNode({ isSigner: false, isWritable: false, name: 'tokenProgramMint' }),
        instructionAccountNode({
            defaultValue: pdaValueNode(
                pdaNode({
                    name: 'tokenProgramVault',
                    seeds: [variablePdaSeedNode('tokenProgramMint', publicKeyTypeNode())],
                }),
                [pdaSeedValueNode('tokenProgramMint', accountValueNode('tokenProgramMint'))],
            ),
            isSigner: false,
            isWritable: true,
            name: 'tokenProgramVault',
        }),
        instructionAccountNode({ isSigner: false, isWritable: false, name: 'nftProgramMint' }),
        instructionAccountNode({
            defaultValue: pdaValueNode(
                pdaNode({
                    name: 'nftProgramEscrow',
                    seeds: [variablePdaSeedNode('nftProgramMint', publicKeyTypeNode())],
                }),
                [pdaSeedValueNode('nftProgramMint', accountValueNode('nftProgramMint'))],
            ),
            isSigner: false,
            isWritable: true,
            name: 'nftProgramEscrow',
        }),
    ]);
});

test('it correctly prefixes nested account seed paths in nested groups', () => {
    const nodes = instructionAccountNodesFromAnchorV01(
        [
            {
                accounts: [
                    { name: 'mint', signer: false, writable: false },
                    {
                        name: 'vault',
                        pda: {
                            seeds: [{ account: 'mint', kind: 'account', path: 'mint.authority' }],
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
                            seeds: [{ account: 'mint', kind: 'account', path: 'mint.authority' }],
                        },
                        signer: false,
                        writable: true,
                    },
                ],
                name: 'nftProgram',
            },
        ],
        [],
        undefined,
        [{ name: 'mint', type: { fields: [{ name: 'authority', type: 'pubkey' }], kind: 'struct' } }],
    );

    expect(nodes).toEqual([
        instructionAccountNode({ isSigner: false, isWritable: false, name: 'tokenProgramMint' }),
        instructionAccountNode({
            defaultValue: pdaValueNode(
                pdaNode({
                    name: 'tokenProgramVault',
                    seeds: [variablePdaSeedNode('tokenProgramMintAuthority', publicKeyTypeNode())],
                }),
                [pdaSeedValueNode('tokenProgramMintAuthority', accountValueNode('tokenProgramMint'))],
            ),
            isSigner: false,
            isWritable: true,
            name: 'tokenProgramVault',
        }),
        instructionAccountNode({ isSigner: false, isWritable: false, name: 'nftProgramMint' }),
        instructionAccountNode({
            defaultValue: pdaValueNode(
                pdaNode({
                    name: 'nftProgramEscrow',
                    seeds: [variablePdaSeedNode('nftProgramMintAuthority', publicKeyTypeNode())],
                }),
                [pdaSeedValueNode('nftProgramMintAuthority', accountValueNode('nftProgramMint'))],
            ),
            isSigner: false,
            isWritable: true,
            name: 'nftProgramEscrow',
        }),
    ]);
});

test('it skips PDA when nested account type cannot be resolved from idlTypes', () => {
    const nodes = instructionAccountNodesFromAnchorV01(
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
            isSigner: false,
            isWritable: false,
            name: 'somePdaAccount',
        }),
    ]);
});

test('it resolves PDA seeds with nested arg paths', () => {
    const nodes = instructionAccountNodesFromAnchorV01(
        [
            {
                name: 'my_pda',
                pda: {
                    seeds: [
                        { kind: 'const', value: [0, 1, 2, 3] },
                        { kind: 'arg', path: 'args.owner' },
                        { kind: 'arg', path: 'args.amount' },
                    ],
                },
                signer: false,
                writable: false,
            },
        ],
        [
            instructionArgumentNode({
                name: 'args',
                type: structTypeNode([
                    structFieldTypeNode({ name: 'owner', type: publicKeyTypeNode() }),
                    structFieldTypeNode({ name: 'amount', type: numberTypeNode('u64') }),
                ]),
            }),
        ],
    );

    expect(nodes).toEqual([
        instructionAccountNode({
            defaultValue: pdaValueNode(
                pdaNode({
                    name: 'myPda',
                    seeds: [
                        constantPdaSeedNodeFromBytes('base58', '1Ldp'),
                        variablePdaSeedNode('owner', publicKeyTypeNode()),
                        variablePdaSeedNode('amount', numberTypeNode('u64')),
                    ],
                }),
                [
                    pdaSeedValueNode('owner', argumentValueNode('owner')),
                    pdaSeedValueNode('amount', argumentValueNode('amount')),
                ],
            ),
            isSigner: false,
            isWritable: false,
            name: 'myPda',
        }),
    ]);
});

test('it resolves PDA default values when account seeds have nested paths', () => {
    const nodes = instructionAccountNodesFromAnchorV01(
        [
            {
                name: 'somePdaAccount',
                pda: {
                    seeds: [
                        { kind: 'arg', path: 'args.owner' },
                        { account: 'mint', kind: 'account', path: 'mint.authority' },
                    ],
                },
                signer: false,
                writable: false,
            },
        ],
        [
            instructionArgumentNode({
                name: 'args',
                type: structTypeNode([structFieldTypeNode({ name: 'owner', type: publicKeyTypeNode() })]),
            }),
        ],
        undefined,
        [{ name: 'mint', type: { fields: [{ name: 'authority', type: 'pubkey' }], kind: 'struct' } }],
    );

    expect(nodes).toEqual([
        instructionAccountNode({
            defaultValue: pdaValueNode(
                pdaNode({
                    name: 'somePdaAccount',
                    seeds: [
                        variablePdaSeedNode('owner', publicKeyTypeNode()),
                        variablePdaSeedNode('mintAuthority', publicKeyTypeNode()),
                    ],
                }),
                [
                    pdaSeedValueNode('owner', argumentValueNode('owner')),
                    pdaSeedValueNode('mintAuthority', accountValueNode('mint')),
                ],
            ),
            isSigner: false,
            isWritable: false,
            name: 'somePdaAccount',
        }),
    ]);
});

test('it ignores PDA default values when nested arg paths are unresolvable', () => {
    const nodes = instructionAccountNodesFromAnchorV01(
        [
            {
                name: 'somePdaAccount',
                pda: {
                    seeds: [
                        { kind: 'const', value: [0, 1, 2, 3] },
                        { kind: 'arg', path: 'args.owner' },
                    ],
                },
                signer: false,
                writable: false,
            },
        ],
        [
            instructionArgumentNode({
                name: 'args',
                type: definedTypeLinkNode('UnknownType'),
            }),
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
                    name: 'programData',
                    programId: 'BPFLoaderUpgradeab1e11111111111111111111111',
                    seeds: [constantPdaSeedNodeFromBytes('base58', 'CDfyUBS8ZuL1L3kEy6mHVyAx1s9E97KNAwTfMfvhCriN')],
                }),
                [],
            ),
            isSigner: false,
            isWritable: false,
            name: 'programData',
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
                    name: 'myPda',
                    seeds: [],
                }),
                [],
                accountValueNode('myProgram'),
            ),
            isSigner: false,
            isWritable: false,
            name: 'myPda',
        }),
    ]);
});

test('it resolves PDA default values when program seed has a nested path', () => {
    const nodes = instructionAccountNodesFromAnchorV01(
        [
            {
                name: 'my_pda',
                pda: {
                    program: { kind: 'arg', path: 'config.programId' },
                    seeds: [{ kind: 'const', value: [0, 1, 2, 3] }],
                },
                signer: false,
                writable: false,
            },
        ],
        [
            instructionArgumentNode({
                name: 'config',
                type: structTypeNode([structFieldTypeNode({ name: 'programId', type: publicKeyTypeNode() })]),
            }),
        ],
    );

    expect(nodes).toEqual([
        instructionAccountNode({
            defaultValue: pdaValueNode(
                pdaNode({
                    name: 'myPda',
                    seeds: [constantPdaSeedNodeFromBytes('base58', '1Ldp')],
                }),
                [],
                argumentValueNode('programId'),
            ),
            isSigner: false,
            isWritable: false,
            name: 'myPda',
        }),
    ]);
});

test('it skips PDA default when a seed references the account itself', () => {
    const nodes = instructionAccountNodesFromAnchorV01(
        [
            {
                name: 'vault',
                pda: {
                    seeds: [
                        { kind: 'const', value: [1, 2, 3] },
                        { kind: 'account', path: 'vault' },
                    ],
                },
                signer: false,
                writable: false,
            },
            {
                name: 'guard',
                pda: {
                    seeds: [
                        { kind: 'const', value: [1, 2, 3] },
                        { account: 'GuardV1', kind: 'account', path: 'guard.mint' },
                    ],
                },
                signer: false,
                writable: false,
            },
            {
                name: 'my_guard',
                pda: {
                    seeds: [
                        { kind: 'const', value: [1, 2, 3] },
                        { account: 'GuardV1', kind: 'account', path: 'my_guard.mint' },
                    ],
                },
                signer: false,
                writable: false,
            },
        ],
        [],
        undefined,
        [{ name: 'GuardV1', type: { fields: [{ name: 'mint', type: 'pubkey' }], kind: 'struct' } }],
    );

    expect(nodes).toEqual([
        instructionAccountNode({
            isSigner: false,
            isWritable: false,
            name: 'vault',
        }),
        instructionAccountNode({
            isSigner: false,
            isWritable: false,
            name: 'guard',
        }),
        instructionAccountNode({
            isSigner: false,
            isWritable: false,
            name: 'myGuard',
        }),
    ]);
});

test('it handles account data paths of length 2', () => {
    const nodes = instructionAccountNodesFromAnchorV01(
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
        undefined,
        [{ name: 'mint', type: { fields: [{ name: 'authority', type: 'pubkey' }], kind: 'struct' } }],
    );

    expect(nodes).toEqual([
        instructionAccountNode({
            defaultValue: pdaValueNode(
                pdaNode({
                    name: 'somePdaAccount',
                    seeds: [variablePdaSeedNode('mintAuthority', publicKeyTypeNode())],
                }),
                [pdaSeedValueNode('mintAuthority', accountValueNode('mint'))],
            ),
            isSigner: false,
            isWritable: false,
            name: 'somePdaAccount',
        }),
    ]);
});
