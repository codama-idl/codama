import {
    bytesTypeNode,
    constantPdaSeedNode,
    constantPdaSeedNodeFromProgramId,
    numberTypeNode,
    numberValueNode,
    pdaNode,
    stringTypeNode,
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

test('it removes the string prefix from variable seeds', () => {
    const node = pdaNodeFromAnchorV00({
        name: 'myPda',
        seeds: [{ description: '', kind: 'variable', name: 'label', type: 'string' }],
    });

    expect(node).toEqual(pdaNode({ name: 'myPda', seeds: [variablePdaSeedNode('label', stringTypeNode('utf8'))] }));
});

test('it removes the bytes prefix from variable seeds', () => {
    const node = pdaNodeFromAnchorV00({
        name: 'myPda',
        seeds: [{ description: '', kind: 'variable', name: 'seedData', type: 'bytes' }],
    });

    expect(node).toEqual(pdaNode({ name: 'myPda', seeds: [variablePdaSeedNode('seedData', bytesTypeNode())] }));
});
