import {
    accountValueNode,
    constantPdaSeedNode,
    constantPdaSeedNodeFromBytes,
    constantPdaSeedNodeFromString,
    dataValueNode,
    definedTypeLinkNode,
    instructionAccountNode,
    integerTypeNode,
    integerValueNode,
    pdaNode,
    pdaSeedValueNode,
    pdaValueNode,
    pluginNode,
    publicKeyTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { instructionAccountNodeFromAnchorV00, instructionAccountNodesFromAnchorV00 } from '../../src';

test('it creates instruction account nodes', () => {
    // When we convert an Anchor instruction account.
    const node = instructionAccountNodeFromAnchorV00({
        docs: ['my docs'],
        isMut: true,
        isOptional: true,
        isSigner: false,
        name: 'my_instruction_account',
    });

    // Then we expect an instruction account node that keeps the IDL casing.
    expect(node).toEqual(
        instructionAccountNode({
            docs: 'my docs',
            identifier: 'my_instruction_account',
            isOptional: true,
            isSigner: false,
            isWritable: true,
        }),
    );
});

test('it flattens nested instruction accounts without prefixing when no duplicates exist', () => {
    // When we convert nested instruction accounts with unique names.
    const nodes = instructionAccountNodesFromAnchorV00([
        { isMut: false, isSigner: false, name: 'accountA' },
        {
            accounts: [
                { isMut: true, isSigner: false, name: 'accountB' },
                { isMut: false, isSigner: true, name: 'accountC' },
            ],
            name: 'nested',
        },
        { isMut: true, isSigner: true, name: 'accountD' },
    ]);

    // Then we expect the nested accounts to be flattened without prefixes.
    expect(nodes).toEqual([
        instructionAccountNode({ identifier: 'accountA', isSigner: false, isWritable: false }),
        instructionAccountNode({ identifier: 'accountB', isSigner: false, isWritable: true }),
        instructionAccountNode({ identifier: 'accountC', isSigner: true, isWritable: false }),
        instructionAccountNode({ identifier: 'accountD', isSigner: true, isWritable: true }),
    ]);
});

test('it prevents duplicate names by prefixing nested accounts with different parent names', () => {
    // When we convert nested instruction accounts whose names collide once flattened.
    const nodes = instructionAccountNodesFromAnchorV00([
        {
            accounts: [
                { isMut: false, isSigner: false, name: 'mint' },
                { isMut: false, isSigner: true, name: 'authority' },
            ],
            name: 'tokenProgram',
        },
        {
            accounts: [
                { isMut: true, isSigner: false, name: 'mint' },
                { isMut: true, isSigner: false, name: 'metadata' },
            ],
            name: 'nftProgram',
        },
    ]);

    // Then we expect the nested accounts to be prefixed by their group names.
    expect(nodes).toEqual([
        instructionAccountNode({ identifier: 'tokenProgram_mint', isSigner: false, isWritable: false }),
        instructionAccountNode({ identifier: 'tokenProgram_authority', isSigner: true, isWritable: false }),
        instructionAccountNode({ identifier: 'nftProgram_mint', isSigner: false, isWritable: true }),
        instructionAccountNode({ identifier: 'nftProgram_metadata', isSigner: false, isWritable: true }),
    ]);
});

test('it prefixes nested accounts whose names only collide once cased', () => {
    // When we convert nested instruction accounts whose names only differ by their casing.
    const nodes = instructionAccountNodesFromAnchorV00([
        { isMut: false, isSigner: false, name: 'token_mint' },
        {
            accounts: [{ isMut: true, isSigner: false, name: 'tokenMint' }],
            name: 'nested',
        },
    ]);

    // Then we expect the nested accounts to be prefixed by their group names.
    expect(nodes).toEqual([
        instructionAccountNode({ identifier: 'token_mint', isSigner: false, isWritable: false }),
        instructionAccountNode({ identifier: 'nested_tokenMint', isSigner: false, isWritable: true }),
    ]);
});

test('it flips legacy relations onto their target accounts', () => {
    // Given legacy relations declared on the accounts carrying the `has_one` constraints.
    const nodes = instructionAccountNodesFromAnchorV00([
        { isMut: true, isSigner: false, name: 'vault', relations: ['authority', 'mint'] },
        { isMut: false, isSigner: false, name: 'escrow', relations: ['authority', 'unknown'] },
        { isMut: false, isSigner: true, name: 'authority' },
        { isMut: false, isSigner: false, name: 'mint' },
    ]);

    // Then we expect the relations to be recorded on the target accounts, as in current IDLs.
    expect(nodes).toEqual([
        instructionAccountNode({ identifier: 'vault', isSigner: false, isWritable: true }),
        instructionAccountNode({ identifier: 'escrow', isSigner: false, isWritable: false }),
        instructionAccountNode({
            identifier: 'authority',
            isSigner: true,
            isWritable: false,
            plugins: [pluginNode('anchor.relations', ['vault', 'escrow'])],
        }),
        instructionAccountNode({
            identifier: 'mint',
            isSigner: false,
            isWritable: false,
            plugins: [pluginNode('anchor.relations', ['vault'])],
        }),
    ]);
});

test('it creates PDA default values from legacy seeds', () => {
    // Given a PDA seeded by constants, an account, a nested argument and a program ID account.
    const nodes = instructionAccountNodesFromAnchorV00(
        [
            { isMut: false, isSigner: false, name: 'authority' },
            { isMut: false, isSigner: false, name: 'other_program' },
            {
                isMut: true,
                isSigner: false,
                name: 'vault',
                pda: {
                    programId: { kind: 'account', path: 'other_program', type: 'publicKey' },
                    seeds: [
                        { kind: 'const', type: 'string', value: 'vault' },
                        { kind: 'const', type: { array: ['u8', 2] }, value: [1, 2] },
                        { kind: 'const', type: 'u8', value: 7 },
                        { kind: 'account', path: 'authority', type: 'publicKey' },
                        { kind: 'arg', path: 'params.name', type: 'string' },
                    ],
                },
            },
        ],
        [structFieldTypeNode({ identifier: 'params', type: definedTypeLinkNode('Params') })],
    );

    // Then we expect a PDA default value whose seed types carry no Borsh size prefix.
    expect(nodes[2]).toEqual(
        instructionAccountNode({
            defaultValue: pdaValueNode(
                pdaNode({
                    identifier: 'vault',
                    seeds: [
                        constantPdaSeedNodeFromString('utf8', 'vault'),
                        constantPdaSeedNodeFromBytes('base16', '0102'),
                        constantPdaSeedNode(integerTypeNode('u8'), integerValueNode('7')),
                        variablePdaSeedNode('authority', publicKeyTypeNode()),
                        variablePdaSeedNode('params_name', stringTypeNode('utf8')),
                    ],
                }),
                {
                    programId: accountValueNode('other_program'),
                    seeds: [
                        pdaSeedValueNode('authority', accountValueNode('authority')),
                        pdaSeedValueNode('params_name', dataValueNode('params.name')),
                    ],
                },
            ),
            identifier: 'vault',
            isSigner: false,
            isWritable: true,
        }),
    );
});

test('it uses constant program IDs and ignores PDAs with nested account seeds', () => {
    // Given a PDA with a constant program ID and a PDA seeded by a field of another account.
    const nodes = instructionAccountNodesFromAnchorV00([
        {
            isMut: false,
            isSigner: false,
            name: 'metadata',
            pda: {
                programId: { kind: 'const', type: 'publicKey', value: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s' },
                seeds: [{ kind: 'const', type: 'string', value: 'metadata' }],
            },
        },
        {
            isMut: false,
            isSigner: false,
            name: 'vault',
            pda: { seeds: [{ account: 'Mint', kind: 'account', path: 'mint.authority', type: 'publicKey' }] },
        },
    ]);

    // Then the first PDA uses the constant program ID and the second one has no default value.
    expect(nodes).toEqual([
        instructionAccountNode({
            defaultValue: pdaValueNode(
                pdaNode({
                    identifier: 'metadata',
                    programId: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
                    seeds: [constantPdaSeedNodeFromString('utf8', 'metadata')],
                }),
            ),
            identifier: 'metadata',
            isSigner: false,
            isWritable: false,
        }),
        instructionAccountNode({ identifier: 'vault', isSigner: false, isWritable: false }),
    ]);
});
