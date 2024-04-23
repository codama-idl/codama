import { arrayTypeNode, fixedCountNode, numberTypeNode, prefixedCountNode, remainderCountNode } from '@kinobi-so/nodes';
import test from 'ava';

import { typeNodeFromAnchorV00 } from '../../../src/index.js';

test('it creates array type nodes', t => {
    t.deepEqual(typeNodeFromAnchorV00({ array: ['u8', 2] }), arrayTypeNode(numberTypeNode('u8'), fixedCountNode(2)));
    t.deepEqual(
        typeNodeFromAnchorV00({ vec: 'u8' }),
        arrayTypeNode(numberTypeNode('u8'), prefixedCountNode(numberTypeNode('u32'))),
    );
    t.deepEqual(
        typeNodeFromAnchorV00({ size: 'u16', vec: 'u8' }),
        arrayTypeNode(numberTypeNode('u8'), prefixedCountNode(numberTypeNode('u16'))),
    );
    t.deepEqual(
        typeNodeFromAnchorV00({ size: 'remainder', vec: 'u8' }),
        arrayTypeNode(numberTypeNode('u8'), remainderCountNode()),
    );
});
