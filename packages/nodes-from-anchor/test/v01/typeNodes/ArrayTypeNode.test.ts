import { arrayTypeNode, fixedCountNode, numberTypeNode, prefixedCountNode } from '@kinobi-so/nodes';
import test from 'ava';

import { typeNodeFromAnchorV01 } from '../../../src/index.js';

test('it creates array type nodes', t => {
    t.deepEqual(typeNodeFromAnchorV01({ array: ['u8', 2] }), arrayTypeNode(numberTypeNode('u8'), fixedCountNode(2)));
    t.deepEqual(
        typeNodeFromAnchorV01({ vec: 'u8' }),
        arrayTypeNode(numberTypeNode('u8'), prefixedCountNode(numberTypeNode('u32'))),
    );
});
