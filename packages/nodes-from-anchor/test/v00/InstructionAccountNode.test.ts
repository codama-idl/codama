import { instructionAccountNode } from '@codama/nodes';
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
