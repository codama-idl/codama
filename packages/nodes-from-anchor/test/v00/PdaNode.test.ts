import {
    bytesTypeNode,
    constantPdaSeedNode,
    constantPdaSeedNodeFromProgramId,
    integerTypeNode,
    integerValueNode,
    pdaNode,
    stringTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { pdaNodeFromAnchorV00 } from '../../src';

test('it creates PDA nodes', () => {
    // When we convert an account with seeds into a PDA.
    const node = pdaNodeFromAnchorV00({
        name: 'my_pda',
        seeds: [
            { kind: 'programId' },
            { kind: 'constant', type: 'u8', value: 42 },
            { description: 'seed description', kind: 'variable', name: 'my_variable_seed', type: 'u16' },
        ],
    });

    // Then we expect a PDA node that keeps the IDL casing.
    expect(node).toEqual(
        pdaNode({
            identifier: 'my_pda',
            seeds: [
                constantPdaSeedNodeFromProgramId(),
                constantPdaSeedNode(integerTypeNode('u8'), integerValueNode('42')),
                variablePdaSeedNode('my_variable_seed', integerTypeNode('u16'), { docs: 'seed description' }),
            ],
        }),
    );
});

test('it removes the string prefix from variable seeds', () => {
    // When we convert a PDA with a string variable seed.
    const node = pdaNodeFromAnchorV00({
        name: 'myPda',
        seeds: [{ description: '', kind: 'variable', name: 'label', type: 'string' }],
    });

    // Then we expect the seed to be an unprefixed string without docs.
    expect(node).toEqual(
        pdaNode({ identifier: 'myPda', seeds: [variablePdaSeedNode('label', stringTypeNode('utf8'))] }),
    );
});

test('it removes the bytes prefix from variable seeds', () => {
    // When we convert a PDA with a bytes variable seed.
    const node = pdaNodeFromAnchorV00({
        name: 'myPda',
        seeds: [{ description: '', kind: 'variable', name: 'seedData', type: 'bytes' }],
    });

    // Then we expect the seed to be unprefixed bytes without docs.
    expect(node).toEqual(pdaNode({ identifier: 'myPda', seeds: [variablePdaSeedNode('seedData', bytesTypeNode())] }));
});
