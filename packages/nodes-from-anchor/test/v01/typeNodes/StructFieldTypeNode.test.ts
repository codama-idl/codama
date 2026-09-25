import { integerTypeNode, structFieldTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { GenericsV01, structFieldTypeNodeFromAnchorV01 } from '../../../src';

const generics = {} as GenericsV01;

test('it creates struct field type nodes', () => {
    const node = structFieldTypeNodeFromAnchorV01(
        {
            name: 'my_instruction_argument',
            type: 'u8',
        },
        generics,
    );

    expect(node).toEqual(
        structFieldTypeNode({
            identifier: 'my_instruction_argument',
            type: integerTypeNode('u8'),
        }),
    );
});

test('it creates struct field type nodes with docs', () => {
    const node = structFieldTypeNodeFromAnchorV01(
        {
            docs: ['The first line.', 'The second line.'],
            name: 'my_field',
            type: 'u8',
        },
        generics,
    );

    expect(node).toEqual(
        structFieldTypeNode({
            docs: 'The first line.\nThe second line.',
            identifier: 'my_field',
            type: integerTypeNode('u8'),
        }),
    );
});
