import { arrayTypeNode, fixedCountNode, numberTypeNode, prefixedCountNode, remainderCountNode } from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV00 } from '../../../src';

test('it creates array type nodes', () => {
    expect(typeNodeFromAnchorV00({ array: ['u8', 2] })).toEqual(arrayTypeNode(numberTypeNode('u8'), fixedCountNode(2)));
    expect(typeNodeFromAnchorV00({ vec: 'u8' })).toEqual(
        arrayTypeNode(numberTypeNode('u8'), prefixedCountNode(numberTypeNode('u32'))),
    );
    expect(typeNodeFromAnchorV00({ size: 'u16', vec: 'u8' })).toEqual(
        arrayTypeNode(numberTypeNode('u8'), prefixedCountNode(numberTypeNode('u16'))),
    );
    expect(typeNodeFromAnchorV00({ size: 'remainder', vec: 'u8' })).toEqual(
        arrayTypeNode(numberTypeNode('u8'), remainderCountNode()),
    );
});
