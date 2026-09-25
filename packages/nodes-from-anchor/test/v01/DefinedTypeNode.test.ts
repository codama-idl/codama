/* eslint-disable sort-keys */
import {
    arrayTypeNode,
    definedTypeNode,
    fixedCountNode,
    integerTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { definedTypeNodeFromAnchorV01, GenericsV01 } from '../../src';

test('it creates defined type nodes', () => {
    const node = definedTypeNodeFromAnchorV01(
        {
            name: 'MyType',
            type: {
                fields: [{ name: 'my_field', type: 'u64' }],
                kind: 'struct',
            },
        },
        {} as GenericsV01,
    );

    expect(node).toEqual(
        definedTypeNode({
            identifier: 'MyType',
            type: structTypeNode([
                structFieldTypeNode({
                    identifier: 'my_field',
                    type: integerTypeNode('u64'),
                }),
            ]),
        }),
    );
});

test('it unwraps generic arguments', () => {
    const node = definedTypeNodeFromAnchorV01(
        {
            name: 'Buffer',
            type: {
                fields: [{ name: 'data', type: { generic: 'T' } }],
                kind: 'struct',
            },
        },
        {
            constArgs: {},
            typeArgs: { T: { name: 'T', kind: 'type', type: 'u64' } },
            types: {},
        },
    );

    expect(node).toEqual(
        definedTypeNode({
            identifier: 'Buffer',
            type: structTypeNode([
                structFieldTypeNode({
                    identifier: 'data',
                    type: integerTypeNode('u64'),
                }),
            ]),
        }),
    );
});

test('it unwraps nested generic types', () => {
    const node = definedTypeNodeFromAnchorV01(
        {
            name: 'Buffer',
            type: {
                fields: [{ name: 'data', type: { generic: 'T' } }],
                kind: 'struct',
            },
        },
        {
            constArgs: {},
            typeArgs: {
                T: {
                    name: 'T',
                    kind: 'type',
                    type: { defined: { name: 'PrefixedData', generics: [{ kind: 'type', type: 'u8' }] } },
                },
            },
            types: {
                PrefixedData: {
                    name: 'PrefixedData',
                    generics: [{ name: 'T', kind: 'type' }],
                    type: {
                        fields: ['u64', { generic: 'T' }],
                        kind: 'struct',
                    },
                },
            },
        },
    );

    expect(node).toEqual(
        definedTypeNode({
            identifier: 'Buffer',
            type: structTypeNode([
                structFieldTypeNode({
                    identifier: 'data',
                    type: tupleTypeNode([integerTypeNode('u64'), integerTypeNode('u8')]),
                }),
            ]),
        }),
    );
});

test('it includes the docs of the defined type', () => {
    const node = definedTypeNodeFromAnchorV01(
        {
            docs: ['My type.', 'With two lines.'],
            name: 'MyType',
            type: { fields: [], kind: 'struct' },
        },
        {} as GenericsV01,
    );

    expect(node).toEqual(
        definedTypeNode({
            docs: 'My type.\nWith two lines.',
            identifier: 'MyType',
            type: structTypeNode([]),
        }),
    );
});

test('it unwraps type aliases', () => {
    // When we convert a defined type declared as `pub type TickArrayBitmap = [u64; 8];`.
    const node = definedTypeNodeFromAnchorV01(
        { name: 'TickArrayBitmap', type: { kind: 'type', alias: { array: ['u64', 8] } } },
        {} as GenericsV01,
    );

    // Then we expect the aliased type.
    expect(node).toEqual(
        definedTypeNode({
            identifier: 'TickArrayBitmap',
            type: arrayTypeNode(integerTypeNode('u64'), fixedCountNode(8)),
        }),
    );
});
