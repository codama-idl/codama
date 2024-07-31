import {
    arrayTypeNode,
    definedTypeNode,
    numberTypeNode,
    prefixedCountNode,
    publicKeyTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../../src';
import { codeContains } from '../_setup';

test('it exports short vecs', () => {
    // Given an array using a shortU16 prefix.
    const node = definedTypeNode({
        name: 'myShortVec',
        type: structTypeNode([
            structFieldTypeNode({
                name: 'value',
                type: arrayTypeNode(publicKeyTypeNode(), prefixedCountNode(numberTypeNode('shortU16'))),
            }),
        ]),
    });

    // When we render the array.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect a short vec to be exported.
    codeContains(renderMap.get('types/my_short_vec.rs'), [
        /pub value: ShortVec<Pubkey>/,
        /use solana_program::pubkey::Pubkey/,
        /use solana_program::short_vec::ShortVec/,
    ]);
});
