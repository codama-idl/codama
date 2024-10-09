import { numberTypeNode, optionTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV01 } from '../../../src';

test('it creates option type nodes', () => {
    expect(typeNodeFromAnchorV01({ option: 'u8' })).toEqual(optionTypeNode(numberTypeNode('u8')));
});

test('it creates option type nodes with fixed size', () => {
    expect(typeNodeFromAnchorV01({ coption: 'u8' })).toEqual(
        optionTypeNode(numberTypeNode('u8'), { fixed: true, prefix: numberTypeNode('u32') }),
    );
    expect(typeNodeFromAnchorV01({ coption: 'u8' })).toEqual(
        optionTypeNode(numberTypeNode('u8'), { fixed: true, prefix: numberTypeNode('u32') }),
    );
});
