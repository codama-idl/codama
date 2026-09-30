import { integerTypeNode, structFieldTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { structFieldTypeNodeFromAnchorV00 } from '../../../src';

test('it creates struct field type nodes', () => {
    // When we convert an Anchor field.
    const node = structFieldTypeNodeFromAnchorV00({
        name: 'my_instruction_argument',
        type: 'u8',
    });

    // Then we expect a struct field type node that keeps the IDL casing.
    expect(node).toEqual(
        structFieldTypeNode({
            identifier: 'my_instruction_argument',
            type: integerTypeNode('u8'),
        }),
    );
});

test('it creates struct field type nodes with docs', () => {
    // When we convert an Anchor field with multiple lines of docs.
    const node = structFieldTypeNodeFromAnchorV00({
        docs: ['First line.', 'Second line.'],
        name: 'amount',
        type: 'u64',
    });

    // Then we expect the docs to be joined into a single string.
    expect(node).toEqual(
        structFieldTypeNode({
            docs: 'First line.\nSecond line.',
            identifier: 'amount',
            type: integerTypeNode('u64'),
        }),
    );
});
