import { bytesTypeNode, constantPdaSeedNode, pdaNode, publicKeyTypeNode, variablePdaSeedNode } from '@kinobi-so/nodes';
import test from 'ava';

import { getAnchorDiscriminatorV01, pdaNodeFromAnchorV01 } from '../../src/index.js';

test('it creates PDA nodes', t => {
    const node = pdaNodeFromAnchorV01({
        name: 'myPda',
        pda: {
            seeds: [
                { kind: 'const', value: [42, 31, 29] },
                { kind: 'account', path: 'authority' },
            ],
        },
    });

    t.deepEqual(
        node,
        pdaNode({
            name: 'myPda',
            seeds: [
                constantPdaSeedNode(bytesTypeNode(), getAnchorDiscriminatorV01([42, 31, 29])),
                variablePdaSeedNode('authority', publicKeyTypeNode()),
            ],
        }),
    );
});
