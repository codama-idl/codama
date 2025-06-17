import { definedTypeNode, numberTypeNode, structFieldTypeNode, structTypeNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../../src';
import { codeContains, codeDoesNotContains } from '../_setup';

test('it exports short u16 numbers', () => {
    // Given a shortU16 number.
    const node = definedTypeNode({
        name: 'myShortU16',
        type: numberTypeNode('shortU16'),
    });

    // When we render the number.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect a short u16 to be exported.
    codeContains(renderMap.get('types/my_short_u16.rs'), [
        /pub type MyShortU16 = ShortU16/,
        /use solana_short_vec::ShortU16/,
    ]);
    codeDoesNotContains(renderMap.get('types/my_short_u16.rs'), [
        /use borsh::BorshSerialize/,
        /use borsh::BorshDeserialize/,
    ]);
});

test('it exports short u16 numbers as struct fields', () => {
    // Given a shortU16 number.
    const node = definedTypeNode({
        name: 'myShortU16',
        type: structTypeNode([structFieldTypeNode({ name: 'value', type: numberTypeNode('shortU16') })]),
    });

    // When we render the number.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect a short u16 to be exported as a struct field.
    codeContains(renderMap.get('types/my_short_u16.rs'), [
        /pub value: ShortU16/,
        /use solana_short_vec::ShortU16/,
    ]);
});
