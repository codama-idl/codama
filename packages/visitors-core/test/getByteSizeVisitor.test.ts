import {
    definedTypeLinkNode,
    definedTypeNode,
    enumEmptyVariantTypeNode,
    enumStructVariantTypeNode,
    enumTupleVariantTypeNode,
    enumTypeNode,
    fixedSizeTypeNode,
    Node,
    NumberFormat,
    numberTypeNode,
    programLinkNode,
    programNode,
    publicKeyTypeNode,
    rootNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getByteSizeVisitor, getRecordLinkablesVisitor, LinkableDictionary, NodeStack, visit, Visitor } from '../src';

const expectSize = (node: Node, expectedSize: number | null) => {
    expect(visit(node, getByteSizeVisitor(new LinkableDictionary(), new NodeStack()) as Visitor<number | null>)).toBe(
        expectedSize,
    );
};

test.each([
    ['u8', 1],
    ['i8', 1],
    ['u16', 2],
    ['i16', 2],
    ['u32', 4],
    ['i32', 4],
    ['u64', 8],
    ['i64', 8],
    ['u128', 16],
    ['i128', 16],
    ['f32', 4],
    ['f64', 8],
])('it gets the size of %i numbers', (format, expectedSize) => {
    expectSize(numberTypeNode(format as NumberFormat), expectedSize);
});

test('it gets the size of public keys', () => {
    expectSize(publicKeyTypeNode(), 32);
});

test('it gets the size of fixed structs', () => {
    expectSize(
        structTypeNode([
            structFieldTypeNode({ name: 'age', type: numberTypeNode('u32') }),
            structFieldTypeNode({
                name: 'firstname',
                type: fixedSizeTypeNode(stringTypeNode('utf8'), 42),
            }),
        ]),
        4 + 42,
    );
});

test('it gets the size of variable structs', () => {
    expectSize(
        structTypeNode([
            structFieldTypeNode({ name: 'age', type: numberTypeNode('u32') }),
            structFieldTypeNode({ name: 'firstname', type: stringTypeNode('utf8') }),
        ]),
        null,
    );
});

test('it gets the size of scalar enums', () => {
    expectSize(
        enumTypeNode([enumEmptyVariantTypeNode('A'), enumEmptyVariantTypeNode('B'), enumEmptyVariantTypeNode('C')], {
            size: numberTypeNode('u64'),
        }),
        8,
    );
});

test('it gets the size of fixed data enums', () => {
    expectSize(
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
});

test('it gets the size of variable data enums', () => {
    expectSize(
        enumTypeNode([
            enumEmptyVariantTypeNode('A'),
            enumTupleVariantTypeNode('B', tupleTypeNode([numberTypeNode('u32')])),
        ]),
        null,
    );
});

test('it follows linked nodes using the correct paths', () => {
    // Given two link nodes designed so that the path would
    // fail if we did not save and restored linked paths.
    const programA = programNode({
        definedTypes: [
            definedTypeNode({
                name: 'typeA',
                type: definedTypeLinkNode('typeB1', programLinkNode('programB')),
            }),
        ],
        name: 'programA',
        publicKey: '1111',
    });
    const programB = programNode({
        definedTypes: [
            definedTypeNode({ name: 'typeB1', type: definedTypeLinkNode('typeB2') }),
            definedTypeNode({ name: 'typeB2', type: numberTypeNode('u64') }),
        ],
        name: 'programB',
        publicKey: '2222',
    });
    const root = rootNode(programA, [programB]);

    // And given a recorded linkables dictionary.
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));

    // When we visit the first defined type.
    const visitor = getByteSizeVisitor(linkables, new NodeStack([root, programA]));
    const result = visit(programA.definedTypes[0], visitor);

    // Then we expect the final linkable to be resolved.
    expect(result).toBe(8);
});
