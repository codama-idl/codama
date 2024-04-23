import { numberTypeNode, publicKeyTypeNode, tupleTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import { typeNodeFromAnchorV00 } from '../../../src/index.js';

test('it creates tuple type nodes', t => {
    const node = typeNodeFromAnchorV00({
        tuple: ['u8', 'publicKey'],
    });

    t.deepEqual(node, tupleTypeNode([numberTypeNode('u8'), publicKeyTypeNode()]));
});
