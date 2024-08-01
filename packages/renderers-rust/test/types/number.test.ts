import { definedTypeNode, numberTypeNode, structFieldTypeNode, structTypeNode } from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../../src';
import { codeContains } from '../_setup';

test('it exports short u16 numbers', () => {
    // Given a shortU16 number.
    const node = definedTypeNode({
        name: 'myShortU16',
        type: structTypeNode([structFieldTypeNode({ name: 'value', type: numberTypeNode('shortU16') })]),
    });

    // When we render the number.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect a short u16 to be exported.
    codeContains(renderMap.get('types/my_short_u16.rs'), [
        /pub value: ShortU16/,
        /use solana_program::short_vec::ShortU16/,
    ]);
});
