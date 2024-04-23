import {
    booleanTypeNode,
    fixedCountNode,
    mapTypeNode,
    numberTypeNode,
    prefixedCountNode,
    remainderCountNode,
} from '@kinobi-so/nodes';
import test from 'ava';

import { typeNodeFromAnchorV00 } from '../../../src/index.js';

test('it creates map type nodes', t => {
    t.deepEqual(
        typeNodeFromAnchorV00({ hashMap: ['u8', 'bool'] }),
        mapTypeNode(numberTypeNode('u8'), booleanTypeNode(), prefixedCountNode(numberTypeNode('u32'))),
    );
    t.deepEqual(
        typeNodeFromAnchorV00({ hashMap: ['u8', 'bool'], size: 2 }),
        mapTypeNode(numberTypeNode('u8'), booleanTypeNode(), fixedCountNode(2)),
    );
    t.deepEqual(
        typeNodeFromAnchorV00({ hashMap: ['u8', 'bool'], size: 'u16' }),
        mapTypeNode(numberTypeNode('u8'), booleanTypeNode(), prefixedCountNode(numberTypeNode('u16'))),
    );
    t.deepEqual(
        typeNodeFromAnchorV00({ hashMap: ['u8', 'bool'], size: 'remainder' }),
        mapTypeNode(numberTypeNode('u8'), booleanTypeNode(), remainderCountNode()),
    );
});
