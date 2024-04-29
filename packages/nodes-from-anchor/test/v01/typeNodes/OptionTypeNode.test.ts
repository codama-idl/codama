import { numberTypeNode, optionTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import { typeNodeFromAnchorV01 } from '../../../src/index.js';

test('it creates option type nodes', t => {
    t.deepEqual(typeNodeFromAnchorV01({ option: 'u8' }), optionTypeNode(numberTypeNode('u8')));
});

test('it creates option type nodes with fixed size', t => {
    t.deepEqual(
        typeNodeFromAnchorV01({ coption: 'u8' }),
        optionTypeNode(numberTypeNode('u8'), { fixed: true, prefix: numberTypeNode('u32') }),
    );
    t.deepEqual(
        typeNodeFromAnchorV01({ coption: 'u8' }),
        optionTypeNode(numberTypeNode('u8'), { fixed: true, prefix: numberTypeNode('u32') }),
    );
});
