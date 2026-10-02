import {
    arrayValueNode,
    booleanValueNode,
    bytesValueNode,
    constantValueNode,
    definedTypeLinkNode,
    enumValueNode,
    floatTypeNode,
    floatValueNode,
    injectedValueNode,
    integerValueNode,
    mapEntryValueNode,
    mapValueNode,
    noneValueNode,
    programLinkNode,
    publicKeyValueNode,
    setValueNode,
    someValueNode,
    stringValueNode,
    structFieldValueNode,
    structValueNode,
    tupleValueNode,
} from '@codama/nodes';
import { describe, expect, test } from 'vitest';

import type { v1 } from '../../src';
import { valueNodeFromV1 } from '../../src/v1ToV2';

// A root without any defined types, for tests that do not follow links.
const root = {
    kind: 'rootNode',
    program: { kind: 'programNode', name: 'myProgram', publicKey: '1111', version: '1.0.0' },
    standard: 'codama',
    version: '1.9.0',
} as unknown as v1.RootNode;
const programPath = [root, root.program];

describe('numbers', () => {
    test('it types numbers using the type they are a value of', () => {
        const u64 = { endian: 'le', format: 'u64', kind: 'numberTypeNode' } as v1.NumberTypeNode;
        const f64 = { endian: 'le', format: 'f64', kind: 'numberTypeNode' } as v1.NumberTypeNode;
        expect(
            valueNodeFromV1([...programPath, { kind: 'numberValueNode', number: 42 }], [...programPath, u64]),
        ).toStrictEqual(integerValueNode('42'));
        expect(
            valueNodeFromV1([...programPath, { kind: 'numberValueNode', number: 42 }], [...programPath, f64]),
        ).toStrictEqual(floatValueNode('42'));
        expect(
            valueNodeFromV1([...programPath, { kind: 'numberValueNode', number: 1.5 }], [...programPath, f64]),
        ).toStrictEqual(floatValueNode('1.5'));
    });

    test('it types numbers through wrappers and quantities', () => {
        const fixedFloat = {
            kind: 'fixedSizeTypeNode',
            size: 8,
            type: { endian: 'le', format: 'f64', kind: 'numberTypeNode' },
        } as v1.FixedSizeTypeNode;
        const amount = {
            decimals: 2,
            kind: 'amountTypeNode',
            number: { endian: 'le', format: 'u64', kind: 'numberTypeNode' },
        } as v1.AmountTypeNode;
        const dateTime = {
            kind: 'dateTimeTypeNode',
            number: { endian: 'le', format: 'i64', kind: 'numberTypeNode' },
        } as v1.DateTimeTypeNode;
        expect(
            valueNodeFromV1([...programPath, { kind: 'numberValueNode', number: 2 }], [...programPath, fixedFloat]),
        ).toStrictEqual(floatValueNode('2'));
        expect(
            valueNodeFromV1([...programPath, { kind: 'numberValueNode', number: 150 }], [...programPath, amount]),
        ).toStrictEqual(integerValueNode('150'));
        expect(
            valueNodeFromV1([...programPath, { kind: 'numberValueNode', number: -1 }], [...programPath, dateTime]),
        ).toStrictEqual(integerValueNode('-1'));
    });

    test('it types numbers through links, including links to other programs', () => {
        // Given a defined type aliasing a float defined in another program.
        const idl = {
            additionalPrograms: [
                {
                    definedTypes: [
                        {
                            kind: 'definedTypeNode',
                            name: 'ratio',
                            type: { endian: 'le', format: 'f64', kind: 'numberTypeNode' },
                        },
                    ],
                    kind: 'programNode',
                    name: 'other',
                    publicKey: '2222',
                    version: '1.0.0',
                },
            ],
            kind: 'rootNode',
            program: {
                definedTypes: [
                    {
                        kind: 'definedTypeNode',
                        name: 'price',
                        type: {
                            kind: 'definedTypeLinkNode',
                            name: 'ratio',
                            program: { kind: 'programLinkNode', name: 'other' },
                        },
                    },
                ],
                kind: 'programNode',
                name: 'main',
                publicKey: '1111',
                version: '1.0.0',
            },
            standard: 'codama',
            version: '1.9.0',
        } as unknown as v1.RootNode;
        const path = [idl, idl.program];

        // Then numbers of that type are floats.
        const price = { kind: 'definedTypeLinkNode', name: 'price' } as v1.DefinedTypeLinkNode;
        expect(valueNodeFromV1([...path, { kind: 'numberValueNode', number: 3 }], [...path, price])).toStrictEqual(
            floatValueNode('3'),
        );
    });

    test('it follows links without a program into the program of the type holding them', () => {
        // Given a main program aliasing a type of another program, which links to its own `base` float.
        const idl = {
            additionalPrograms: [
                {
                    definedTypes: [
                        { kind: 'definedTypeNode', name: 'ratio', type: { kind: 'definedTypeLinkNode', name: 'base' } },
                        {
                            kind: 'definedTypeNode',
                            name: 'base',
                            type: { endian: 'le', format: 'f64', kind: 'numberTypeNode' },
                        },
                    ],
                    kind: 'programNode',
                    name: 'other',
                    publicKey: '2222',
                    version: '1.0.0',
                },
            ],
            kind: 'rootNode',
            program: {
                definedTypes: [
                    {
                        kind: 'definedTypeNode',
                        name: 'base',
                        type: { endian: 'le', format: 'u64', kind: 'numberTypeNode' },
                    },
                ],
                kind: 'programNode',
                name: 'main',
                publicKey: '1111',
                version: '1.0.0',
            },
            standard: 'codama',
            version: '1.9.0',
        } as unknown as v1.RootNode;
        const [other] = idl.additionalPrograms!;
        const value = { kind: 'numberValueNode', number: 3 } as v1.NumberValueNode;
        const base = { kind: 'definedTypeLinkNode', name: 'base' } as v1.DefinedTypeLinkNode;
        const ratio = {
            kind: 'definedTypeLinkNode',
            name: 'ratio',
            program: { kind: 'programLinkNode', name: 'other' },
        } as v1.DefinedTypeLinkNode;

        // Then links without a program point into the closest program of the path.
        expect(valueNodeFromV1([idl, idl.program, value], [idl, idl.program, base])).toStrictEqual(
            integerValueNode('3'),
        );
        expect(valueNodeFromV1([idl, other, value], [idl, other, base])).toStrictEqual(floatValueNode('3'));

        // And the links of a linked type point into the program of that type.
        expect(valueNodeFromV1([idl, idl.program, value], [idl, idl.program, ratio])).toStrictEqual(
            floatValueNode('3'),
        );
    });

    test('it types numbers from their own value without a type', () => {
        expect(valueNodeFromV1([...programPath, { kind: 'numberValueNode', number: 42 }], undefined)).toStrictEqual(
            integerValueNode('42'),
        );
        expect(valueNodeFromV1([...programPath, { kind: 'numberValueNode', number: 0.5 }], undefined)).toStrictEqual(
            floatValueNode('0.5'),
        );
    });

    test('it keeps non-integral numbers of integer types as floats', () => {
        const u64 = { endian: 'le', format: 'u64', kind: 'numberTypeNode' } as v1.NumberTypeNode;
        expect(
            valueNodeFromV1([...programPath, { kind: 'numberValueNode', number: 1.5 }], [...programPath, u64]),
        ).toStrictEqual(floatValueNode('1.5'));
    });

    test('it types numbers without a type when links dangle or cycle', () => {
        // Given two defined types aliasing each other.
        const idl = {
            kind: 'rootNode',
            program: {
                definedTypes: [
                    { kind: 'definedTypeNode', name: 'a', type: { kind: 'definedTypeLinkNode', name: 'b' } },
                    { kind: 'definedTypeNode', name: 'b', type: { kind: 'definedTypeLinkNode', name: 'a' } },
                ],
                kind: 'programNode',
                name: 'main',
                publicKey: '1111',
                version: '1.0.0',
            },
            standard: 'codama',
            version: '1.9.0',
        } as unknown as v1.RootNode;
        const path = [idl, idl.program];

        // Then numbers of dangling or cyclic links are typed from their own value.
        const missing = { kind: 'definedTypeLinkNode', name: 'missing' } as v1.DefinedTypeLinkNode;
        const cyclic = { kind: 'definedTypeLinkNode', name: 'a' } as v1.DefinedTypeLinkNode;
        expect(valueNodeFromV1([...path, { kind: 'numberValueNode', number: 2 }], [...path, missing])).toStrictEqual(
            integerValueNode('2'),
        );
        expect(valueNodeFromV1([...path, { kind: 'numberValueNode', number: 2 }], [...path, cyclic])).toStrictEqual(
            integerValueNode('2'),
        );
    }, 1000);
});

describe('nested values', () => {
    test('it types the values nested in other values', () => {
        // Given a struct type holding floats in every kind of container.
        const type = {
            fields: [
                {
                    kind: 'structFieldTypeNode',
                    name: 'ratio',
                    type: { endian: 'le', format: 'f64', kind: 'numberTypeNode' },
                },
                {
                    kind: 'structFieldTypeNode',
                    name: 'ratios',
                    type: {
                        count: { kind: 'remainderCountNode' },
                        item: { endian: 'le', format: 'f64', kind: 'numberTypeNode' },
                        kind: 'arrayTypeNode',
                    },
                },
                {
                    kind: 'structFieldTypeNode',
                    name: 'set',
                    type: {
                        count: { kind: 'remainderCountNode' },
                        item: { endian: 'le', format: 'f64', kind: 'numberTypeNode' },
                        kind: 'setTypeNode',
                    },
                },
                {
                    kind: 'structFieldTypeNode',
                    name: 'pair',
                    type: {
                        items: [
                            { endian: 'le', format: 'u64', kind: 'numberTypeNode' },
                            { endian: 'le', format: 'f64', kind: 'numberTypeNode' },
                        ],
                        kind: 'tupleTypeNode',
                    },
                },
                {
                    kind: 'structFieldTypeNode',
                    name: 'maybe',
                    type: {
                        item: { endian: 'le', format: 'f64', kind: 'numberTypeNode' },
                        kind: 'optionTypeNode',
                        prefix: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                    },
                },
                {
                    kind: 'structFieldTypeNode',
                    name: 'map',
                    type: {
                        count: { kind: 'remainderCountNode' },
                        key: { endian: 'le', format: 'u64', kind: 'numberTypeNode' },
                        kind: 'mapTypeNode',
                        value: { endian: 'le', format: 'f64', kind: 'numberTypeNode' },
                    },
                },
            ],
            kind: 'structTypeNode',
        } as v1.StructTypeNode;
        const value = {
            fields: [
                {
                    kind: 'structFieldValueNode',
                    name: 'map',
                    value: {
                        entries: [
                            {
                                key: { kind: 'numberValueNode', number: 1 },
                                kind: 'mapEntryValueNode',
                                value: { kind: 'numberValueNode', number: 2 },
                            },
                        ],
                        kind: 'mapValueNode',
                    },
                },
                {
                    kind: 'structFieldValueNode',
                    name: 'maybe',
                    value: { kind: 'someValueNode', value: { kind: 'numberValueNode', number: 1 } },
                },
                {
                    kind: 'structFieldValueNode',
                    name: 'pair',
                    value: {
                        items: [
                            { kind: 'numberValueNode', number: 1 },
                            { kind: 'numberValueNode', number: 2 },
                        ],
                        kind: 'tupleValueNode',
                    },
                },
                { kind: 'structFieldValueNode', name: 'ratio', value: { kind: 'numberValueNode', number: 1 } },
                {
                    kind: 'structFieldValueNode',
                    name: 'ratios',
                    value: { items: [{ kind: 'numberValueNode', number: 1 }], kind: 'arrayValueNode' },
                },
                {
                    kind: 'structFieldValueNode',
                    name: 'set',
                    value: { items: [{ kind: 'numberValueNode', number: 1 }], kind: 'setValueNode' },
                },
            ],
            kind: 'structValueNode',
        } as v1.StructValueNode;

        // Then every nested number is typed by its own position.
        expect(valueNodeFromV1([...programPath, value], [...programPath, type])).toStrictEqual(
            structValueNode([
                structFieldValueNode(
                    'map',
                    mapValueNode([mapEntryValueNode(integerValueNode('1'), floatValueNode('2'))]),
                ),
                structFieldValueNode('maybe', someValueNode(floatValueNode('1'))),
                structFieldValueNode('pair', tupleValueNode([integerValueNode('1'), floatValueNode('2')])),
                structFieldValueNode('ratio', floatValueNode('1')),
                structFieldValueNode('ratios', arrayValueNode([floatValueNode('1')])),
                structFieldValueNode('set', setValueNode([floatValueNode('1')])),
            ]),
        );
    });

    test('it types the fallbacks of injected values with the type of the injection', () => {
        const type = { endian: 'le', format: 'f64', kind: 'numberTypeNode' } as v1.NumberTypeNode;
        const value = {
            fallback: { kind: 'numberValueNode', number: 1 },
            key: 'rate',
            kind: 'injectedValueNode',
        } as v1.InjectedValueNode;
        expect(valueNodeFromV1([...programPath, value], [...programPath, type])).toStrictEqual(
            injectedValueNode({ fallback: floatValueNode('1'), key: 'rate' }),
        );
    });

    test('it types constant values with their own type', () => {
        const type = { endian: 'le', format: 'u64', kind: 'numberTypeNode' } as v1.NumberTypeNode;
        const value = {
            kind: 'constantValueNode',
            type: { endian: 'le', format: 'f64', kind: 'numberTypeNode' },
            value: { kind: 'numberValueNode', number: 1 },
        } as v1.ConstantValueNode;
        expect(valueNodeFromV1([...programPath, value], [...programPath, type])).toStrictEqual(
            constantValueNode(floatTypeNode('f64'), floatValueNode('1')),
        );
    });

    test('it converts leaf values', () => {
        const publicKey = {
            identifier: 'system',
            kind: 'publicKeyValueNode',
            publicKey: '11111111111111111111111111111111',
        } as v1.PublicKeyValueNode;
        expect(valueNodeFromV1([...programPath, { boolean: true, kind: 'booleanValueNode' }], undefined)).toStrictEqual(
            booleanValueNode(true),
        );
        expect(
            valueNodeFromV1([...programPath, { data: '0102', encoding: 'base16', kind: 'bytesValueNode' }], undefined),
        ).toStrictEqual(bytesValueNode('base16', '0102'));
        expect(valueNodeFromV1([...programPath, { kind: 'noneValueNode' }], undefined)).toStrictEqual(noneValueNode());
        expect(valueNodeFromV1([...programPath, { kind: 'stringValueNode', string: 'Hi' }], undefined)).toStrictEqual(
            stringValueNode('Hi'),
        );
        expect(valueNodeFromV1([...programPath, publicKey], undefined)).toStrictEqual(
            publicKeyValueNode('11111111111111111111111111111111', { identifier: 'system' }),
        );
    });
});

describe('enum values', () => {
    test('it converts enum values without payloads', () => {
        // Given an enum defined type with a variant without data.
        const idl = {
            kind: 'rootNode',
            program: {
                definedTypes: [
                    {
                        kind: 'definedTypeNode',
                        name: 'action',
                        type: {
                            kind: 'enumTypeNode',
                            size: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                            variants: [{ kind: 'enumEmptyVariantTypeNode', name: 'stop' }],
                        },
                    },
                ],
                kind: 'programNode',
                name: 'main',
                publicKey: '1111',
                version: '1.0.0',
            },
            standard: 'codama',
            version: '1.9.0',
        } as unknown as v1.RootNode;
        const path = [idl, idl.program];

        // Then values of that variant have no payload.
        const value = {
            enum: { kind: 'definedTypeLinkNode', name: 'action' },
            kind: 'enumValueNode',
            variant: 'stop',
        } as v1.EnumValueNode;
        expect(valueNodeFromV1([...path, value], undefined)).toStrictEqual(
            enumValueNode(definedTypeLinkNode('action'), 'stop'),
        );
    });

    test('it types payloads with the data of their variant', () => {
        // Given an enum defined type with struct and tuple variants holding floats.
        const idl = {
            kind: 'rootNode',
            program: {
                definedTypes: [
                    {
                        kind: 'definedTypeNode',
                        name: 'action',
                        type: {
                            kind: 'enumTypeNode',
                            size: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                            variants: [
                                {
                                    kind: 'enumStructVariantTypeNode',
                                    name: 'move',
                                    struct: {
                                        fields: [
                                            {
                                                kind: 'structFieldTypeNode',
                                                name: 'speed',
                                                type: { endian: 'le', format: 'f64', kind: 'numberTypeNode' },
                                            },
                                        ],
                                        kind: 'structTypeNode',
                                    },
                                },
                                {
                                    kind: 'enumTupleVariantTypeNode',
                                    name: 'pair',
                                    tuple: {
                                        items: [
                                            { endian: 'le', format: 'u64', kind: 'numberTypeNode' },
                                            { endian: 'le', format: 'f64', kind: 'numberTypeNode' },
                                        ],
                                        kind: 'tupleTypeNode',
                                    },
                                },
                            ],
                        },
                    },
                ],
                kind: 'programNode',
                name: 'main',
                publicKey: '1111',
                version: '1.0.0',
            },
            standard: 'codama',
            version: '1.9.0',
        } as unknown as v1.RootNode;
        const path = [idl, idl.program];

        // Then their payloads are typed by the data of their variant.
        const move = {
            enum: { kind: 'definedTypeLinkNode', name: 'action' },
            kind: 'enumValueNode',
            value: {
                fields: [
                    { kind: 'structFieldValueNode', name: 'speed', value: { kind: 'numberValueNode', number: 2 } },
                ],
                kind: 'structValueNode',
            },
            variant: 'move',
        } as v1.EnumValueNode;
        const pair = {
            enum: { kind: 'definedTypeLinkNode', name: 'action' },
            kind: 'enumValueNode',
            value: {
                items: [
                    { kind: 'numberValueNode', number: 1 },
                    { kind: 'numberValueNode', number: 2 },
                ],
                kind: 'tupleValueNode',
            },
            variant: 'pair',
        } as v1.EnumValueNode;
        expect(valueNodeFromV1([...path, move], undefined)).toStrictEqual(
            enumValueNode(definedTypeLinkNode('action'), 'move', {
                value: structValueNode([structFieldValueNode('speed', floatValueNode('2'))]),
            }),
        );
        expect(valueNodeFromV1([...path, pair], undefined)).toStrictEqual(
            enumValueNode(definedTypeLinkNode('action'), 'pair', {
                value: tupleValueNode([integerValueNode('1'), floatValueNode('2')]),
            }),
        );
    });

    test('it keeps the tuple payloads of 1-tuple variants, typed by their item', () => {
        // Given an enum defined type with a 1-tuple variant of floats.
        const idl = {
            kind: 'rootNode',
            program: {
                definedTypes: [
                    {
                        kind: 'definedTypeNode',
                        name: 'action',
                        type: {
                            kind: 'enumTypeNode',
                            size: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                            variants: [
                                {
                                    kind: 'enumTupleVariantTypeNode',
                                    name: 'wait',
                                    tuple: {
                                        items: [{ endian: 'le', format: 'f64', kind: 'numberTypeNode' }],
                                        kind: 'tupleTypeNode',
                                    },
                                },
                            ],
                        },
                    },
                ],
                kind: 'programNode',
                name: 'main',
                publicKey: '1111',
                version: '1.0.0',
            },
            standard: 'codama',
            version: '1.9.0',
        } as unknown as v1.RootNode;
        const path = [idl, idl.program];

        // Then payloads of that variant stay tuples, with their item typed as a float.
        const value = {
            enum: { kind: 'definedTypeLinkNode', name: 'action' },
            kind: 'enumValueNode',
            value: { items: [{ kind: 'numberValueNode', number: 3 }], kind: 'tupleValueNode' },
            variant: 'wait',
        } as v1.EnumValueNode;
        expect(valueNodeFromV1([...path, value], undefined)).toStrictEqual(
            enumValueNode(definedTypeLinkNode('action'), 'wait', { value: tupleValueNode([floatValueNode('3')]) }),
        );
    });

    test('it resolves enums of other programs', () => {
        // Given an enum defined type with a 1-tuple variant in another program.
        const idl = {
            additionalPrograms: [
                {
                    definedTypes: [
                        {
                            kind: 'definedTypeNode',
                            name: 'action',
                            type: {
                                kind: 'enumTypeNode',
                                size: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                                variants: [
                                    {
                                        kind: 'enumTupleVariantTypeNode',
                                        name: 'wait',
                                        tuple: {
                                            items: [{ endian: 'le', format: 'f64', kind: 'numberTypeNode' }],
                                            kind: 'tupleTypeNode',
                                        },
                                    },
                                ],
                            },
                        },
                    ],
                    kind: 'programNode',
                    name: 'other',
                    publicKey: '2222',
                    version: '1.0.0',
                },
            ],
            kind: 'rootNode',
            program: { kind: 'programNode', name: 'main', publicKey: '1111', version: '1.0.0' },
            standard: 'codama',
            version: '1.9.0',
        } as unknown as v1.RootNode;
        const path = [idl, idl.program];

        // Then values linking to that enum are resolved in that program.
        const value = {
            enum: { kind: 'definedTypeLinkNode', name: 'action', program: { kind: 'programLinkNode', name: 'other' } },
            kind: 'enumValueNode',
            value: { items: [{ kind: 'numberValueNode', number: 3 }], kind: 'tupleValueNode' },
            variant: 'wait',
        } as v1.EnumValueNode;
        expect(valueNodeFromV1([...path, value], undefined)).toStrictEqual(
            enumValueNode(definedTypeLinkNode('action', { program: programLinkNode('other') }), 'wait', {
                value: tupleValueNode([floatValueNode('3')]),
            }),
        );
    });

    test('it resolves enum links without a program in the program of the value', () => {
        // Given two programs both defining a `mode` enum, with an f64 or u64 payload.
        const idl = {
            additionalPrograms: [
                {
                    definedTypes: [
                        {
                            kind: 'definedTypeNode',
                            name: 'mode',
                            type: {
                                kind: 'enumTypeNode',
                                size: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                                variants: [
                                    {
                                        kind: 'enumTupleVariantTypeNode',
                                        name: 'on',
                                        tuple: {
                                            items: [{ endian: 'le', format: 'f64', kind: 'numberTypeNode' }],
                                            kind: 'tupleTypeNode',
                                        },
                                    },
                                ],
                            },
                        },
                        {
                            kind: 'definedTypeNode',
                            name: 'config',
                            type: {
                                fields: [
                                    {
                                        kind: 'structFieldTypeNode',
                                        name: 'm',
                                        type: { kind: 'definedTypeLinkNode', name: 'mode' },
                                    },
                                ],
                                kind: 'structTypeNode',
                            },
                        },
                    ],
                    kind: 'programNode',
                    name: 'other',
                    publicKey: '2222',
                    version: '1.0.0',
                },
            ],
            kind: 'rootNode',
            program: {
                definedTypes: [
                    {
                        kind: 'definedTypeNode',
                        name: 'mode',
                        type: {
                            kind: 'enumTypeNode',
                            size: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                            variants: [
                                {
                                    kind: 'enumTupleVariantTypeNode',
                                    name: 'on',
                                    tuple: {
                                        items: [{ endian: 'le', format: 'u64', kind: 'numberTypeNode' }],
                                        kind: 'tupleTypeNode',
                                    },
                                },
                            ],
                        },
                    },
                ],
                kind: 'programNode',
                name: 'main',
                publicKey: '1111',
                version: '1.0.0',
            },
            standard: 'codama',
            version: '1.9.0',
        } as unknown as v1.RootNode;

        // When a value in the main program, typed by `other.config`, holds an enum value linking to `mode`.
        const value = {
            fields: [
                {
                    kind: 'structFieldValueNode',
                    name: 'm',
                    value: {
                        enum: { kind: 'definedTypeLinkNode', name: 'mode' },
                        kind: 'enumValueNode',
                        value: { items: [{ kind: 'numberValueNode', number: 3 }], kind: 'tupleValueNode' },
                        variant: 'on',
                    },
                },
            ],
            kind: 'structValueNode',
        } as unknown as v1.StructValueNode;
        const config = {
            kind: 'definedTypeLinkNode',
            name: 'config',
            program: { kind: 'programLinkNode', name: 'other' },
        } as v1.DefinedTypeLinkNode;

        // Then the enum link points into the main program, where the value is written.
        expect(valueNodeFromV1([idl, idl.program, value], [idl, idl.program, config])).toStrictEqual(
            structValueNode([
                structFieldValueNode(
                    'm',
                    enumValueNode(definedTypeLinkNode('mode'), 'on', {
                        value: tupleValueNode([integerValueNode('3')]),
                    }),
                ),
            ]),
        );
    });

    test('it keeps payloads as is when enums cannot be resolved', () => {
        const value = {
            enum: { kind: 'definedTypeLinkNode', name: 'missing' },
            kind: 'enumValueNode',
            value: { items: [{ kind: 'numberValueNode', number: 3 }], kind: 'tupleValueNode' },
            variant: 'wait',
        } as v1.EnumValueNode;
        expect(valueNodeFromV1([...programPath, value], undefined)).toStrictEqual(
            enumValueNode(definedTypeLinkNode('missing'), 'wait', { value: tupleValueNode([integerValueNode('3')]) }),
        );
    });
});
