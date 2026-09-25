import { integerTypeNode, optionTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV00 } from '../../../src';

test('it creates option type nodes', () => {
    expect(typeNodeFromAnchorV00({ option: 'u8' })).toEqual(optionTypeNode(integerTypeNode('u8')));
});

test('it creates option type nodes with custom prefixes', () => {
    expect(typeNodeFromAnchorV00({ option: 'u8', prefix: 'u64' })).toEqual(
        optionTypeNode(integerTypeNode('u8'), { prefix: integerTypeNode('u64') }),
    );
});

test('it creates option type nodes with fixed size', () => {
    expect(typeNodeFromAnchorV00({ coption: 'u8' })).toEqual(
        optionTypeNode(integerTypeNode('u8'), { fixed: true, prefix: integerTypeNode('u32') }),
    );
    expect(typeNodeFromAnchorV00({ coption: 'u8', prefix: 'u16' })).toEqual(
        optionTypeNode(integerTypeNode('u8'), { fixed: true, prefix: integerTypeNode('u16') }),
    );
});
