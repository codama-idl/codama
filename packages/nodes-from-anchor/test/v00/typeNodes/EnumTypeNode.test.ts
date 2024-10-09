import {
    booleanTypeNode,
    enumEmptyVariantTypeNode,
    enumStructVariantTypeNode,
    enumTupleVariantTypeNode,
    enumTypeNode,
    numberTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV00 } from '../../../src';

test('it creates enum type nodes', () => {
    const node = typeNodeFromAnchorV00({
        kind: 'enum',
        variants: [
            { name: 'variantA' }, // Empty variant.
            { fields: ['u16', 'bool'], name: 'variantB' }, // Tuple variant.
            { fields: [{ name: 'age', type: 'u8' }], name: 'variantC' }, // Struct variant.
        ],
    });

    expect(node).toEqual(
        enumTypeNode([
            enumEmptyVariantTypeNode('variantA'),
            enumTupleVariantTypeNode('variantB', tupleTypeNode([numberTypeNode('u16'), booleanTypeNode()])),
            enumStructVariantTypeNode(
                'variantC',
                structTypeNode([structFieldTypeNode({ name: 'age', type: numberTypeNode('u8') })]),
            ),
        ]),
    );
});

test('it creates enum type nodes with custom sizes', () => {
    const node = typeNodeFromAnchorV00({ kind: 'enum', size: 'u16', variants: [] });
    expect(node).toEqual(enumTypeNode([], { size: numberTypeNode('u16') }));
});
