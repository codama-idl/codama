import {
    booleanTypeNode,
    fixedCountNode,
    integerTypeNode,
    mapTypeNode,
    prefixedCountNode,
    remainderCountNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV00 } from '../../../src';

test('it creates map type nodes', () => {
    expect(typeNodeFromAnchorV00({ hashMap: ['u8', 'bool'] })).toEqual(
        mapTypeNode(integerTypeNode('u8'), booleanTypeNode(), prefixedCountNode(integerTypeNode('u32'))),
    );
    expect(typeNodeFromAnchorV00({ hashMap: ['u8', 'bool'], size: 2 })).toEqual(
        mapTypeNode(integerTypeNode('u8'), booleanTypeNode(), fixedCountNode(2)),
    );
    expect(typeNodeFromAnchorV00({ hashMap: ['u8', 'bool'], size: 'u16' })).toEqual(
        mapTypeNode(integerTypeNode('u8'), booleanTypeNode(), prefixedCountNode(integerTypeNode('u16'))),
    );
    expect(typeNodeFromAnchorV00({ hashMap: ['u8', 'bool'], size: 'remainder' })).toEqual(
        mapTypeNode(integerTypeNode('u8'), booleanTypeNode(), remainderCountNode()),
    );
});
