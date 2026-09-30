import {
    booleanTypeNode,
    enumTypeNode,
    enumVariantTypeNode,
    integerTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV00 } from '../../../src';

test('it creates enum type nodes', () => {
    // When we convert the Anchor type.
    const node = typeNodeFromAnchorV00({
        kind: 'enum',
        variants: [
            { name: 'VariantA' }, // Empty variant.
            { fields: ['u16', 'bool'], name: 'VariantB' }, // Tuple variant.
            { fields: [{ name: 'age', type: 'u8' }], name: 'VariantC' }, // Struct variant.
        ],
    });

    // Then we expect the equivalent Codama type node.
    expect(node).toEqual(
        enumTypeNode(
            [
                enumVariantTypeNode('VariantA'),
                enumVariantTypeNode('VariantB', { data: tupleTypeNode([integerTypeNode('u16'), booleanTypeNode()]) }),
                enumVariantTypeNode('VariantC', {
                    data: structTypeNode([structFieldTypeNode({ identifier: 'age', type: integerTypeNode('u8') })]),
                }),
            ],
            { size: integerTypeNode('u8') },
        ),
    );
});

test('it creates enum type nodes with custom sizes', () => {
    // When we convert the Anchor type.
    const node = typeNodeFromAnchorV00({ kind: 'enum', size: 'u16', variants: [] });

    // Then we expect the equivalent Codama type node.
    expect(node).toEqual(enumTypeNode([], { size: integerTypeNode('u16') }));
});
