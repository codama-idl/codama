import {
    numberTypeNode,
    publicKeyTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV01 } from '../../../src/index.js';

test('it creates tuple type nodes', () => {
    const node = typeNodeFromAnchorV01({
        fields: ['u8', 'pubkey'],
        kind: 'struct',
    });

    expect(node).toEqual(tupleTypeNode([numberTypeNode('u8'), publicKeyTypeNode()]));
});

test('it creates struct type when defined field names', () => {
    const node = typeNodeFromAnchorV01({
        fields: [
            { name: 'symbol', type: 'u8' },
            { name: 'mint', type: 'pubkey' },
        ],
        kind: 'struct',
    });

    expect(node).toEqual(
        structTypeNode([
            structFieldTypeNode({ name: 'symbol', type: numberTypeNode('u8') }),
            structFieldTypeNode({ name: 'mint', type: publicKeyTypeNode() }),
        ]),
    );
});
