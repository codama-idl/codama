import {
    bytesTypeNode,
    constantPdaSeedNode,
    fixedSizeTypeNode,
    pdaNode,
    publicKeyTypeNode,
    variablePdaSeedNode,
} from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { getAnchorDiscriminatorV01, pdaNodeFromAnchorV01 } from '../../src';

test('it creates PDA nodes', () => {
    const node = pdaNodeFromAnchorV01({
        name: 'myPda',
        pda: {
            seeds: [
                { kind: 'const', value: [42, 31, 29] },
                { kind: 'account', path: 'authority' },
            ],
        },
    });

    expect(node).toEqual(
        pdaNode({
            name: 'myPda',
            seeds: [
                constantPdaSeedNode(fixedSizeTypeNode(bytesTypeNode(), 3), getAnchorDiscriminatorV01([42, 31, 29])),
                variablePdaSeedNode('authority', publicKeyTypeNode()),
            ],
        }),
    );
});
