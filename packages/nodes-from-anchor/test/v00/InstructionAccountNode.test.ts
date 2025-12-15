import { instructionAccountNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { instructionAccountNodeFromAnchorV00, instructionAccountNodesFromAnchorV00 } from '../../src';

test('it creates instruction account nodes', () => {
    const node = instructionAccountNodeFromAnchorV00({
        docs: ['my docs'],
        isMut: true,
        isOptional: true,
        isSigner: false,
        name: 'myInstructionAccount',
    });

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

    expect(nodes).toEqual([
        instructionAccountNode({ isSigner: false, isWritable: false, name: 'accountA' }),
        instructionAccountNode({ isSigner: false, isWritable: true, name: 'accountB' }),
        instructionAccountNode({ isSigner: true, isWritable: false, name: 'accountC' }),
        instructionAccountNode({ isSigner: true, isWritable: true, name: 'accountD' }),
    ]);
});

test('it prevents duplicate names by prefixing nested accounts with different parent names', () => {
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

    expect(nodes).toEqual([
        instructionAccountNode({ isSigner: false, isWritable: false, name: 'tokenProgramMint' }),
        instructionAccountNode({ isSigner: true, isWritable: false, name: 'tokenProgramAuthority' }),
        instructionAccountNode({ isSigner: false, isWritable: true, name: 'nftProgramMint' }),
        instructionAccountNode({ isSigner: false, isWritable: true, name: 'nftProgramMetadata' }),
    ]);
});
