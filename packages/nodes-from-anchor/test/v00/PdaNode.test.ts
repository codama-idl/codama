import {
    constantPdaSeedNode,
    constantPdaSeedNodeFromProgramId,
    numberTypeNode,
    numberValueNode,
    pdaNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { pdaNodeFromAnchorV00 } from '../../src';

test('it creates PDA nodes', () => {
    const node = pdaNodeFromAnchorV00({
        name: 'myPda',
        seeds: [
            { kind: 'programId' },
            { kind: 'constant', type: 'u8', value: 42 },
            { description: 'seed description', kind: 'variable', name: 'myVariableSeed', type: 'u16' },
        ],
    });

    expect(node).toEqual(
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
