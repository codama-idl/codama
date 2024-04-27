import {
    enumEmptyVariantTypeNode,
    enumStructVariantTypeNode,
    enumTupleVariantTypeNode,
    enumTypeNode,
    fixedSizeTypeNode,
    Node,
    numberTypeNode,
    publicKeyTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@kinobi-so/nodes';
import test from 'ava';

import { getByteSizeVisitor, LinkableDictionary, visit, Visitor } from '../src/index.js';

const macro = test.macro((t, node: Node, expectedSize: number | null) => {
    t.is(visit(node, getByteSizeVisitor(new LinkableDictionary()) as Visitor<number | null>), expectedSize);
});

test('it gets the size of public keys', macro, publicKeyTypeNode(), 32);
test('it gets the size of u8 numbers', macro, numberTypeNode('u8'), 1);
test('it gets the size of i8 numbers', macro, numberTypeNode('i8'), 1);
test('it gets the size of u16 numbers', macro, numberTypeNode('u16'), 2);
test('it gets the size of i16 numbers', macro, numberTypeNode('i16'), 2);
test('it gets the size of u32 numbers', macro, numberTypeNode('u32'), 4);
test('it gets the size of i32 numbers', macro, numberTypeNode('i32'), 4);
test('it gets the size of u64 numbers', macro, numberTypeNode('u64'), 8);
test('it gets the size of i64 numbers', macro, numberTypeNode('i64'), 8);
test('it gets the size of u128 numbers', macro, numberTypeNode('u128'), 16);
test('it gets the size of i128 numbers', macro, numberTypeNode('i128'), 16);
test('it gets the size of f32 numbers', macro, numberTypeNode('f32'), 4);
test('it gets the size of f64 numbers', macro, numberTypeNode('f64'), 8);

test(
    'it gets the size of fixed structs',
    macro,
    structTypeNode([
        structFieldTypeNode({ name: 'age', type: numberTypeNode('u32') }),
        structFieldTypeNode({
            name: 'firstname',
            type: fixedSizeTypeNode(stringTypeNode('utf8'), 42),
        }),
    ]),
    4 + 42,
);
test(
    'it gets the size of variable structs',
    macro,
    structTypeNode([
        structFieldTypeNode({ name: 'age', type: numberTypeNode('u32') }),
        structFieldTypeNode({ name: 'firstname', type: stringTypeNode('utf8') }),
    ]),
    null,
);
test(
    'it gets the size of scalar enums',
    macro,
    enumTypeNode([enumEmptyVariantTypeNode('A'), enumEmptyVariantTypeNode('B'), enumEmptyVariantTypeNode('C')], {
        size: numberTypeNode('u64'),
    }),
    8,
);
test(
    'it gets the size of fixed data enums',
    macro,
    enumTypeNode(
        [
            enumTupleVariantTypeNode('A', tupleTypeNode([numberTypeNode('u32')])),
            enumStructVariantTypeNode(
                'B',
                structTypeNode([
                    structFieldTypeNode({ name: 'x', type: numberTypeNode('u16') }),
                    structFieldTypeNode({ name: 'y', type: numberTypeNode('u16') }),
                ]),
            ),
        ],
        { size: numberTypeNode('u8') },
    ),
    1 + 4,
);
test(
    'it gets the size of variable data enums',
    macro,
    enumTypeNode([
        enumEmptyVariantTypeNode('A'),
        enumTupleVariantTypeNode('B', tupleTypeNode([numberTypeNode('u32')])),
    ]),
    null,
);
