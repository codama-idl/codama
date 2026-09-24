import {
    CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_CONFLICTING_ATTRIBUTES,
    CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_PLUGINS,
    CodamaError,
} from '@codama/errors';
import {
    accountNode,
    fixedSizeTransformNode,
    identifierString,
    integerTypeNode,
    pluginNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { flattenStruct, flattenStructVisitor } from '../src';

const u8Field = (identifier: string) => structFieldTypeNode({ identifier, type: integerTypeNode('u8') });

test('it inlines the fields of struct fields', () => {
    // Given an account whose data contains a nested struct.
    const node = accountNode({
        data: structTypeNode([
            u8Field('a'),
            structFieldTypeNode({ identifier: 'nested', type: structTypeNode([u8Field('b'), u8Field('c')]) }),
        ]),
        identifier: 'myAccount',
    });

    // When we flatten its data.
    const result = visit(node, flattenStructVisitor({ myAccount: '*' }));

    // Then the nested fields are inlined.
    expect(result).toStrictEqual(
        accountNode({ data: structTypeNode([u8Field('a'), u8Field('b'), u8Field('c')]), identifier: 'myAccount' }),
    );
});

test('it only inlines the listed fields, matched exactly', () => {
    // Given a struct with two nested structs.
    const node = structTypeNode([
        structFieldTypeNode({ identifier: 'first_group', type: structTypeNode([u8Field('a')]) }),
        structFieldTypeNode({ identifier: 'secondGroup', type: structTypeNode([u8Field('b')]) }),
    ]);

    // When we flatten the first one using another casing, then nothing is inlined.
    expect(flattenStruct(node, ['firstGroup'])).toStrictEqual(node);

    // When we flatten the first one using its exact identifier, then only that one is inlined.
    expect(flattenStruct(node, ['first_group'])).toStrictEqual(
        structTypeNode([
            u8Field('a'),
            structFieldTypeNode({ identifier: 'secondGroup', type: structTypeNode([u8Field('b')]) }),
        ]),
    );
});

test('it keeps the transforms and plugins of the flattened struct', () => {
    // Given a fixed-size struct with plugins, containing a nested struct.
    const node = structTypeNode([structFieldTypeNode({ identifier: 'nested', type: structTypeNode([u8Field('a')]) })], {
        plugins: [pluginNode('my.plugin')],
        transforms: [fixedSizeTransformNode(32)],
    });

    // When we flatten it, then its transforms and plugins are preserved.
    expect(flattenStruct(node)).toStrictEqual(
        structTypeNode([u8Field('a')], {
            plugins: [pluginNode('my.plugin')],
            transforms: [fixedSizeTransformNode(32)],
        }),
    );
});

test('it does not inline structs that carry transforms', () => {
    // Given a struct field whose struct is fixed-size.
    const node = structTypeNode([
        structFieldTypeNode({
            identifier: 'nested',
            type: structTypeNode([u8Field('a')], { transforms: [fixedSizeTransformNode(32)] }),
        }),
    ]);

    // When we flatten it, then the field is kept since inlining would drop the fixed size.
    expect(flattenStruct(node)).toStrictEqual(node);
});

test('it throws when inlined fields collide in camelCase', () => {
    // Given a struct whose nested struct has a field colliding with a sibling field.
    const node = structTypeNode([
        u8Field('max_supply'),
        structFieldTypeNode({ identifier: 'nested', type: structTypeNode([u8Field('maxSupply')]) }),
    ]);

    // When we flatten it, then we expect a conflict error listing both identifiers.
    expect(() => flattenStruct(node)).toThrow(
        new CodamaError(CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_CONFLICTING_ATTRIBUTES, {
            conflictingAttributes: [identifierString('max_supply'), identifierString('maxSupply')],
        }),
    );
});

test('it throws when a struct to inline carries plugins', () => {
    // Given a struct field whose struct carries plugins.
    const field = structFieldTypeNode({
        identifier: 'nested',
        type: structTypeNode([u8Field('a')], { plugins: [pluginNode('my.plugin')] }),
    });
    const node = structTypeNode([u8Field('b'), field]);

    // When we flatten it, then we expect an error since the plugins would be lost.
    expect(() => flattenStruct(node)).toThrow(
        new CodamaError(CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_PLUGINS, {
            field,
            fieldName: identifierString('nested'),
        }),
    );

    // Unless that field is not selected for flattening.
    expect(flattenStruct(node, ['other'])).toStrictEqual(node);
});
