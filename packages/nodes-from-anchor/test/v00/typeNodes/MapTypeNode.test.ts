import {
    booleanTypeNode,
    fixedCountNode,
    mapTypeNode,
    numberTypeNode,
    prefixedCountNode,
    remainderCountNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV00 } from '../../../src';

test('it creates map type nodes', () => {
    expect(typeNodeFromAnchorV00({ hashMap: ['u8', 'bool'] })).toEqual(
        mapTypeNode(numberTypeNode('u8'), booleanTypeNode(), prefixedCountNode(numberTypeNode('u32'))),
    );
    expect(typeNodeFromAnchorV00({ hashMap: ['u8', 'bool'], size: 2 })).toEqual(
        mapTypeNode(numberTypeNode('u8'), booleanTypeNode(), fixedCountNode(2)),
    );
    expect(typeNodeFromAnchorV00({ hashMap: ['u8', 'bool'], size: 'u16' })).toEqual(
        mapTypeNode(numberTypeNode('u8'), booleanTypeNode(), prefixedCountNode(numberTypeNode('u16'))),
    );
    expect(typeNodeFromAnchorV00({ hashMap: ['u8', 'bool'], size: 'remainder' })).toEqual(
        mapTypeNode(numberTypeNode('u8'), booleanTypeNode(), remainderCountNode()),
    );
});
