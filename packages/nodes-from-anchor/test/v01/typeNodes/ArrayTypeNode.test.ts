import { arrayTypeNode, fixedCountNode, numberTypeNode, prefixedCountNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV01 } from '../../../src';

test('it creates array type nodes', () => {
    expect(typeNodeFromAnchorV01({ array: ['u8', 2] })).toEqual(arrayTypeNode(numberTypeNode('u8'), fixedCountNode(2)));
    expect(typeNodeFromAnchorV01({ vec: 'u8' })).toEqual(
        arrayTypeNode(numberTypeNode('u8'), prefixedCountNode(numberTypeNode('u32'))),
    );
});
