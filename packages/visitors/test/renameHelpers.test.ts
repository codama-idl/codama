import {
    enumTypeNode,
    enumVariantTypeNode,
    fixedSizeTransformNode,
    integerTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { renameEnumNode, renameStructNode } from '../src/renameHelpers';

test('it renames struct fields and keeps the struct transforms', () => {
    // Given a fixed-size struct.
    const node = structTypeNode(
        [
            structFieldTypeNode({ identifier: 'a', type: integerTypeNode('u8') }),
            structFieldTypeNode({ identifier: 'constructor', type: integerTypeNode('u8') }),
        ],
        { transforms: [fixedSizeTransformNode(4)] },
    );

    // When we rename one of its fields, including one named after an object prototype key.
    const result = renameStructNode(node, { a: 'b' });

    // Then only that field is renamed and the transforms are kept.
    expect(result).toStrictEqual(
        structTypeNode(
            [
                structFieldTypeNode({ identifier: 'b', type: integerTypeNode('u8') }),
                structFieldTypeNode({ identifier: 'constructor', type: integerTypeNode('u8') }),
            ],
            { transforms: [fixedSizeTransformNode(4)] },
        ),
    );
});

test('it renames enum variants and keeps their attributes', () => {
    // Given an enum with explicit discriminators and a data variant.
    const node = enumTypeNode(
        [
            enumVariantTypeNode('a', { discriminator: 5 }),
            enumVariantTypeNode('b', { data: integerTypeNode('u32'), discriminator: 7 }),
        ],
        { size: integerTypeNode('u16') },
    );

    // When we rename both variants.
    const result = renameEnumNode(node, { a: 'x', b: 'y' });

    // Then their discriminators and data are preserved, as is the enum size.
    expect(result).toStrictEqual(
        enumTypeNode(
            [
                enumVariantTypeNode('x', { discriminator: 5 }),
                enumVariantTypeNode('y', { data: integerTypeNode('u32'), discriminator: 7 }),
            ],
            { size: integerTypeNode('u16') },
        ),
    );
});
