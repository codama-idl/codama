import { numberTypeNode, optionTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV00 } from '../../../src';

test('it creates option type nodes', () => {
    expect(typeNodeFromAnchorV00({ option: 'u8' })).toEqual(optionTypeNode(numberTypeNode('u8')));
});

test('it creates option type nodes with custom prefixes', () => {
    expect(typeNodeFromAnchorV00({ option: 'u8', prefix: 'u64' })).toEqual(
        optionTypeNode(numberTypeNode('u8'), { prefix: numberTypeNode('u64') }),
    );
});

test('it creates option type nodes with fixed size', () => {
    expect(typeNodeFromAnchorV00({ coption: 'u8' })).toEqual(
        optionTypeNode(numberTypeNode('u8'), { fixed: true, prefix: numberTypeNode('u32') }),
    );
    expect(typeNodeFromAnchorV00({ coption: 'u8', prefix: 'u16' })).toEqual(
        optionTypeNode(numberTypeNode('u8'), { fixed: true, prefix: numberTypeNode('u16') }),
    );
});
