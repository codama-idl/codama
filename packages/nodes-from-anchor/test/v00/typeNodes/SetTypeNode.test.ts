import { fixedCountNode, numberTypeNode, prefixedCountNode, remainderCountNode, setTypeNode } from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV00 } from '../../../src';

test('it creates set type nodes', () => {
    expect(typeNodeFromAnchorV00({ hashSet: 'u8' })).toEqual(
        setTypeNode(numberTypeNode('u8'), prefixedCountNode(numberTypeNode('u32'))),
    );
    expect(typeNodeFromAnchorV00({ hashSet: 'u8', size: 2 })).toEqual(
        setTypeNode(numberTypeNode('u8'), fixedCountNode(2)),
    );
    expect(typeNodeFromAnchorV00({ hashSet: 'u8', size: 'u16' })).toEqual(
        setTypeNode(numberTypeNode('u8'), prefixedCountNode(numberTypeNode('u16'))),
    );
    expect(typeNodeFromAnchorV00({ hashSet: 'u8', size: 'remainder' })).toEqual(
        setTypeNode(numberTypeNode('u8'), remainderCountNode()),
    );
});
