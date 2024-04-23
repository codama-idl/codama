import { numberTypeNode, optionTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import { typeNodeFromAnchorV00 } from '../../../src/index.js';

test('it creates option type nodes', t => {
    t.deepEqual(typeNodeFromAnchorV00({ option: 'u8' }), optionTypeNode(numberTypeNode('u8')));
});

test('it creates option type nodes with custom prefixes', t => {
    t.deepEqual(
        typeNodeFromAnchorV00({ option: 'u8', prefix: 'u64' }),
        optionTypeNode(numberTypeNode('u8'), { prefix: numberTypeNode('u64') }),
    );
});

test('it creates option type nodes with fixed size', t => {
    t.deepEqual(
        typeNodeFromAnchorV00({ coption: 'u8' }),
        optionTypeNode(numberTypeNode('u8'), { fixed: true, prefix: numberTypeNode('u32') }),
    );
    t.deepEqual(
        typeNodeFromAnchorV00({ coption: 'u8', prefix: 'u16' }),
        optionTypeNode(numberTypeNode('u8'), { fixed: true, prefix: numberTypeNode('u16') }),
    );
});
