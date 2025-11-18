/* eslint-disable sort-keys-fix/sort-keys-fix */
import { definedTypeNode, numberTypeNode, structFieldTypeNode, structTypeNode, tupleTypeNode } from '@codama/nodes';
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
            name: 'myType',
            type: structTypeNode([
                structFieldTypeNode({
                    name: 'myField',
                    type: numberTypeNode('u64'),
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
            name: 'buffer',
            type: structTypeNode([
                structFieldTypeNode({
                    name: 'data',
                    type: numberTypeNode('u64'),
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
            name: 'buffer',
            type: structTypeNode([
                structFieldTypeNode({
                    name: 'data',
                    type: tupleTypeNode([numberTypeNode('u64'), numberTypeNode('u8')]),
                }),
            ]),
        }),
    );
});
