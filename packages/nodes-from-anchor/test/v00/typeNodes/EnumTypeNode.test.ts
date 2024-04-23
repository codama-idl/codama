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
} from '@kinobi-so/nodes';
import test from 'ava';

import { typeNodeFromAnchorV00 } from '../../../src/index.js';

test('it creates enum type nodes', t => {
    const node = typeNodeFromAnchorV00({
        kind: 'enum',
        variants: [
            { name: 'variantA' }, // Empty variant.
            { fields: ['u16', 'bool'], name: 'variantB' }, // Tuple variant.
            { fields: [{ name: 'age', type: 'u8' }], name: 'variantC' }, // Struct variant.
        ],
    });

    t.deepEqual(
        node,
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

test('it creates enum type nodes with custom sizes', t => {
    const node = typeNodeFromAnchorV00({ kind: 'enum', size: 'u16', variants: [] });
    t.deepEqual(node, enumTypeNode([], { size: numberTypeNode('u16') }));
});
