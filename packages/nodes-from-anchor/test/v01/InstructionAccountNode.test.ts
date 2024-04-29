import { instructionAccountNode } from '@kinobi-so/nodes';
import test from 'ava';

import { instructionAccountNodeFromAnchorV01, instructionAccountNodesFromAnchorV01 } from '../../src/index.js';

test('it creates instruction account nodes', t => {
    const node = instructionAccountNodeFromAnchorV01({
        docs: ['my docs'],
        name: 'MyInstructionAccount',
        optional: true,
        signer: false,
        writable: true,
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
    const nodes = instructionAccountNodesFromAnchorV01([
        { name: 'accountA', signer: false, writable: false },
        {
            accounts: [
                {
                    name: 'AccountB',
                    signer: false,
                    writable: true,
                },
                {
                    name: 'AccountC',
                    signer: true,
                    writable: false,
                },
            ],
            name: 'nested',
        },
        { name: 'AccountD', signer: true, writable: true },
    ]);

    t.deepEqual(nodes, [
        instructionAccountNode({ isSigner: false, isWritable: false, name: 'accountA' }),
        instructionAccountNode({ isSigner: false, isWritable: true, name: 'accountB' }),
        instructionAccountNode({ isSigner: true, isWritable: false, name: 'accountC' }),
        instructionAccountNode({ isSigner: true, isWritable: true, name: 'accountD' }),
    ]);
});
