import {
    constantPdaSeedNode,
    constantPdaSeedNodeFromProgramId,
    numberTypeNode,
    numberValueNode,
    pdaNode,
    variablePdaSeedNode,
} from '@kinobi-so/nodes';
import test from 'ava';

import { pdaNodeFromAnchorV00 } from '../../src/index.js';

test('it creates PDA nodes', t => {
    const node = pdaNodeFromAnchorV00({
        name: 'myPda',
        seeds: [
            { kind: 'programId' },
            { kind: 'constant', type: 'u8', value: 42 },
            { description: 'seed description', kind: 'variable', name: 'myVariableSeed', type: 'u16' },
        ],
    });

    t.deepEqual(
        node,
        pdaNode({
            name: 'myPda',
            seeds: [
                constantPdaSeedNodeFromProgramId(),
                constantPdaSeedNode(numberTypeNode('u8'), numberValueNode(42)),
                variablePdaSeedNode('myVariableSeed', numberTypeNode('u16'), 'seed description'),
            ],
        }),
    );
});
