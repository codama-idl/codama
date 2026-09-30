import { integerTypeNode, optionTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { GenericsV01, typeNodeFromAnchorV01 } from '../../../src';

const generics = {} as GenericsV01;

test('it creates option type nodes', () => {
    expect(typeNodeFromAnchorV01({ option: 'u8' }, generics)).toEqual(optionTypeNode(integerTypeNode('u8')));
});

test('it creates option type nodes with fixed size', () => {
    expect(typeNodeFromAnchorV01({ coption: 'u8' }, generics)).toEqual(
        optionTypeNode(integerTypeNode('u8'), { fixed: true, prefix: integerTypeNode('u32') }),
    );
});
