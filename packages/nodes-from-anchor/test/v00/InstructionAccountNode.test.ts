import { instructionAccountNode } from '@kinobi-so/nodes';
import test from 'ava';

import { instructionAccountNodeFromAnchorV00, instructionAccountNodesFromAnchorV00 } from '../../src/index.js';

test('it creates instruction account nodes', t => {
    const node = instructionAccountNodeFromAnchorV00({
        docs: ['my docs'],
        isMut: true,
        isOptional: true,
        isSigner: false,
        name: 'myInstructionAccount',
    });

    t.deepEqual(
        node,
        instructionAccountNode({
            docs: ['my docs'],
            isOptional: true,
            isSigner: false,
            isWritable: true,
            name: 'myInstructionAccount',
        }),
    );
});

test('it flattens nested instruction accounts', t => {
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

    t.deepEqual(nodes, [
        instructionAccountNode({ isSigner: false, isWritable: false, name: 'accountA' }),
        instructionAccountNode({ isSigner: false, isWritable: true, name: 'accountB' }),
        instructionAccountNode({ isSigner: true, isWritable: false, name: 'accountC' }),
        instructionAccountNode({ isSigner: true, isWritable: true, name: 'accountD' }),
    ]);
});
