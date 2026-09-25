import { fixedCountNode, integerTypeNode, prefixedCountNode, remainderCountNode, setTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV00 } from '../../../src';

test('it creates set type nodes', () => {
    expect(typeNodeFromAnchorV00({ hashSet: 'u8' })).toEqual(
        setTypeNode(integerTypeNode('u8'), prefixedCountNode(integerTypeNode('u32'))),
    );
    expect(typeNodeFromAnchorV00({ hashSet: 'u8', size: 2 })).toEqual(
        setTypeNode(integerTypeNode('u8'), fixedCountNode(2)),
    );
    expect(typeNodeFromAnchorV00({ hashSet: 'u8', size: 'u16' })).toEqual(
        setTypeNode(integerTypeNode('u8'), prefixedCountNode(integerTypeNode('u16'))),
    );
    expect(typeNodeFromAnchorV00({ hashSet: 'u8', size: 'remainder' })).toEqual(
        setTypeNode(integerTypeNode('u8'), remainderCountNode()),
    );
});
