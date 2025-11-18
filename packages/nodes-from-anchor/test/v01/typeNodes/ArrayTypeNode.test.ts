import { arrayTypeNode, fixedCountNode, numberTypeNode, prefixedCountNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { GenericsV01, typeNodeFromAnchorV01 } from '../../../src';

const generics = {} as GenericsV01;

test('it creates array type nodes', () => {
    expect(typeNodeFromAnchorV01({ array: ['u8', 2] }, generics)).toEqual(
        arrayTypeNode(numberTypeNode('u8'), fixedCountNode(2)),
    );
    expect(typeNodeFromAnchorV01({ vec: 'u8' }, generics)).toEqual(
        arrayTypeNode(numberTypeNode('u8'), prefixedCountNode(numberTypeNode('u32'))),
    );
});

test('it unwraps array nodes with generic sizes', () => {
    expect(
        typeNodeFromAnchorV01(
            { array: ['u8', { generic: 'N' }] },
            {
                constArgs: { N: { kind: 'const', name: 'N', type: 'usize', value: '100' } },
                typeArgs: {},
                types: {},
            },
        ),
    ).toEqual(arrayTypeNode(numberTypeNode('u8'), fixedCountNode(100)));
});
