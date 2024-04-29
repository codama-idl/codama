import { numberTypeNode, publicKeyTypeNode, tupleTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import { typeNodeFromAnchorV01 } from '../../../src/index.js';

test('it creates tuple type nodes', t => {
    const node = typeNodeFromAnchorV01({
        fields: ['u8', 'pubkey'],
        kind: 'struct',
    });

    t.deepEqual(node, tupleTypeNode([numberTypeNode('u8'), publicKeyTypeNode()]));
});
