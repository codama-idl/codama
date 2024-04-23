import { fixedCountNode, numberTypeNode, prefixedCountNode, remainderCountNode, setTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import { typeNodeFromAnchorV00 } from '../../../src/index.js';

test('it creates set type nodes', t => {
    t.deepEqual(
        typeNodeFromAnchorV00({ hashSet: 'u8' }),
        setTypeNode(numberTypeNode('u8'), prefixedCountNode(numberTypeNode('u32'))),
    );
    t.deepEqual(
        typeNodeFromAnchorV00({ hashSet: 'u8', size: 2 }),
        setTypeNode(numberTypeNode('u8'), fixedCountNode(2)),
    );
    t.deepEqual(
        typeNodeFromAnchorV00({ hashSet: 'u8', size: 'u16' }),
        setTypeNode(numberTypeNode('u8'), prefixedCountNode(numberTypeNode('u16'))),
    );
    t.deepEqual(
        typeNodeFromAnchorV00({ hashSet: 'u8', size: 'remainder' }),
        setTypeNode(numberTypeNode('u8'), remainderCountNode()),
    );
});
