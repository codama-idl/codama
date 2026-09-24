import {
    definedTypeLinkNode,
    DefinedTypeNode,
    definedTypeNode,
    enumTypeNode,
    EnumVariantTypeNode,
    enumVariantTypeNode,
    fixedSizeTransformNode,
    integerTypeNode,
    programNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { unwrapTupleEnumWithSingleStructVisitor } from '../src';

const struct = structTypeNode([structFieldTypeNode({ identifier: 'x', type: integerTypeNode('u32') })]);

const programWithEnum = (variants: EnumVariantTypeNode[], extraTypes: DefinedTypeNode[] = []) =>
    rootNode(
        programNode({
            definedTypes: [definedTypeNode({ identifier: 'myEnum', type: enumTypeNode(variants) }), ...extraTypes],
            identifier: 'myProgram',
            publicKey: '1111',
        }),
    );

test('it unwraps tuple variants containing a single struct', () => {
    // Given an enum variant whose data is a tuple with a single struct.
    const node = programWithEnum([enumVariantTypeNode('move', { data: tupleTypeNode([struct]) })]);

    // When we unwrap tuple enums with a single struct.
    const result = visit(node, unwrapTupleEnumWithSingleStructVisitor());

    // Then the variant's data is the struct itself.
    expect(result).toStrictEqual(programWithEnum([enumVariantTypeNode('move', { data: struct })]));
});

test('it keeps the discriminator of the variant and the transforms of the tuple', () => {
    // Given a variant with an explicit discriminator and a tuple with transforms.
    const node = programWithEnum([
        enumVariantTypeNode('move', {
            data: tupleTypeNode([struct], { transforms: [fixedSizeTransformNode(8)] }),
            discriminator: 5,
        }),
    ]);

    // When we unwrap it.
    const result = visit(node, unwrapTupleEnumWithSingleStructVisitor());

    // Then both are preserved.
    expect(result).toStrictEqual(
        programWithEnum([
            enumVariantTypeNode('move', {
                data: structTypeNode(struct.fields, { transforms: [fixedSizeTransformNode(8)] }),
                discriminator: 5,
            }),
        ]),
    );
});

test('it unwraps links to structs and removes the unused defined types', () => {
    // Given a variant whose tuple links to a struct type used nowhere else.
    const node = programWithEnum(
        [enumVariantTypeNode('move', { data: tupleTypeNode([definedTypeLinkNode('moveArgs')]) })],
        [definedTypeNode({ identifier: 'moveArgs', type: struct })],
    );

    // When we unwrap it.
    const result = visit(node, unwrapTupleEnumWithSingleStructVisitor());

    // Then the struct is inlined and the defined type removed.
    expect(result).toStrictEqual(programWithEnum([enumVariantTypeNode('move', { data: struct })]));
});

test('it keeps linked defined types that are still used elsewhere', () => {
    // Given a variant whose tuple links to a struct type that is also used by another type.
    const moveArgs = definedTypeNode({ identifier: 'moveArgs', type: struct });
    const alias = definedTypeNode({ identifier: 'alias', type: definedTypeLinkNode('moveArgs') });
    const node = programWithEnum(
        [enumVariantTypeNode('move', { data: tupleTypeNode([definedTypeLinkNode('moveArgs')]) })],
        [moveArgs, alias],
    );

    // When we unwrap it.
    const result = visit(node, unwrapTupleEnumWithSingleStructVisitor());

    // Then the struct is inlined in the variant but the defined type is kept.
    expect(result).toStrictEqual(programWithEnum([enumVariantTypeNode('move', { data: struct })], [moveArgs, alias]));
});

test('it only unwraps the selected variants', () => {
    // Given two variants that could be unwrapped.
    const node = programWithEnum([
        enumVariantTypeNode('move', { data: tupleTypeNode([struct]) }),
        enumVariantTypeNode('jump', { data: tupleTypeNode([struct]) }),
    ]);

    // When we only select one of them.
    const result = visit(node, unwrapTupleEnumWithSingleStructVisitor(['myEnum.move']));

    // Then only that one is unwrapped.
    expect(result).toStrictEqual(
        programWithEnum([
            enumVariantTypeNode('move', { data: struct }),
            enumVariantTypeNode('jump', { data: tupleTypeNode([struct]) }),
        ]),
    );
});

test('it ignores tuples that do not contain exactly one struct', () => {
    // Given variants with a two-item tuple and a single non-struct item.
    const node = programWithEnum([
        enumVariantTypeNode('pair', { data: tupleTypeNode([struct, struct]) }),
        enumVariantTypeNode('number', { data: tupleTypeNode([integerTypeNode('u8')]) }),
    ]);

    // When we unwrap them, then nothing changes.
    expect(visit(node, unwrapTupleEnumWithSingleStructVisitor())).toStrictEqual(node);
});
