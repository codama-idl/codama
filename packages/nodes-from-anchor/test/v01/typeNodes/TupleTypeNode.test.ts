import { numberTypeNode, publicKeyTypeNode, tupleTypeNode } from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV01 } from '../../../src/index.js';

test('it creates tuple type nodes', () => {
    const node = typeNodeFromAnchorV01({
        fields: ['u8', 'pubkey'],
        kind: 'struct',
    });

    expect(node).toEqual(tupleTypeNode([numberTypeNode('u8'), publicKeyTypeNode()]));
});
