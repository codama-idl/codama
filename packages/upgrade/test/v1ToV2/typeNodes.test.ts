import { CODAMA_ERROR__UNEXPECTED_NODE_KIND, CodamaError } from '@codama/errors';
import {
    amountNumberDisplayNode,
    arrayTypeNode,
    booleanTypeNode,
    bytesTypeNode,
    constantValueNode,
    dateTimeTypeNode,
    definedTypeLinkNode,
    durationTypeNode,
    enumTypeNode,
    enumVariantDisplayNode,
    enumVariantTypeNode,
    fixedCountNode,
    fixedPointTypeNode,
    fixedSizeTransformNode,
    floatTypeNode,
    hiddenPrefixTransformNode,
    hiddenSuffixTransformNode,
    injectedValueNode,
    integerTypeNode,
    integerValueNode,
    mapTypeNode,
    optionTypeNode,
    postOffsetTransformNode,
    prefixedCountNode,
    preOffsetTransformNode,
    programLinkNode,
    publicKeyTypeNode,
    remainderCountNode,
    remainderOptionTypeNode,
    sentinelTransformNode,
    setTypeNode,
    sizePrefixTransformNode,
    stringDisplayNode,
    stringTypeNode,
    stringValueNode,
    structFieldDisplayNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
    unitNumberDisplayNode,
    zeroableOptionTypeNode,
} from '@codama/nodes';
import { describe, expect, test } from 'vitest';

import type { v1 } from '../../src';
import { integerTypeNodeFromV1, typeNodeFromV1 } from '../../src/v1ToV2';

// A root without any defined types, since these tests do not follow links.
const root = {
    kind: 'rootNode',
    program: { kind: 'programNode', name: 'myProgram', publicKey: '1111', version: '1.0.0' },
    standard: 'codama',
    version: '1.9.0',
} as unknown as v1.RootNode;
const programPath = [root, root.program];

describe('numbers', () => {
    test('it splits numbers into integers and floats', () => {
        const u64 = { endian: 'le', format: 'u64', kind: 'numberTypeNode' } as v1.NumberTypeNode;
        const shortU16 = { endian: 'le', format: 'shortU16', kind: 'numberTypeNode' } as v1.NumberTypeNode;
        const f32 = { endian: 'be', format: 'f32', kind: 'numberTypeNode' } as v1.NumberTypeNode;
        expect(typeNodeFromV1([...programPath, u64])).toStrictEqual(integerTypeNode('u64'));
        expect(typeNodeFromV1([...programPath, shortU16])).toStrictEqual(integerTypeNode('shortU16'));
        expect(typeNodeFromV1([...programPath, f32])).toStrictEqual(floatTypeNode('f32', { endian: 'be' }));
    });

    test('it keeps amount displays with decimals', () => {
        const type = {
            display: {
                decimals: { key: 'decimals', kind: 'injectedValueNode' },
                kind: 'amountNumberDisplayNode',
                unit: { kind: 'stringValueNode', string: 'USDC' },
            },
            endian: 'le',
            format: 'u64',
            kind: 'numberTypeNode',
        } as v1.NumberTypeNode;
        expect(typeNodeFromV1([...programPath, type])).toStrictEqual(
            integerTypeNode('u64', {
                display: amountNumberDisplayNode({
                    decimals: injectedValueNode({ key: 'decimals' }),
                    unit: stringValueNode('USDC'),
                }),
            }),
        );
    });

    test('it turns amount displays without decimals into unit displays', () => {
        const withUnit = {
            display: { kind: 'amountNumberDisplayNode', unit: { kind: 'stringValueNode', string: 'bps' } },
            endian: 'le',
            format: 'u16',
            kind: 'numberTypeNode',
        } as v1.NumberTypeNode;
        const withoutUnit = {
            display: { kind: 'amountNumberDisplayNode' },
            endian: 'le',
            format: 'u16',
            kind: 'numberTypeNode',
        } as v1.NumberTypeNode;
        expect(typeNodeFromV1([...programPath, withUnit])).toStrictEqual(
            integerTypeNode('u16', { display: unitNumberDisplayNode({ unit: stringValueNode('bps') }) }),
        );
        expect(typeNodeFromV1([...programPath, withoutUnit])).toStrictEqual(integerTypeNode('u16'));
    });

    test('it only keeps the unit of amount displays on floats', () => {
        const type = {
            display: {
                decimals: { kind: 'numberValueNode', number: 2 },
                kind: 'amountNumberDisplayNode',
                unit: { kind: 'stringValueNode', string: '%' },
            },
            endian: 'le',
            format: 'f64',
            kind: 'numberTypeNode',
        } as v1.NumberTypeNode;
        expect(typeNodeFromV1([...programPath, type])).toStrictEqual(
            floatTypeNode('f64', { display: unitNumberDisplayNode({ unit: stringValueNode('%') }) }),
        );
    });

    test('it turns date-time and duration displays into types', () => {
        const dateTime = {
            display: { kind: 'dateTimeNumberDisplayNode', ticksPerSecond: 1000 },
            endian: 'le',
            format: 'i64',
            kind: 'numberTypeNode',
        } as v1.NumberTypeNode;
        const duration = {
            display: { kind: 'durationNumberDisplayNode' },
            endian: 'le',
            format: 'u32',
            kind: 'numberTypeNode',
        } as v1.NumberTypeNode;
        expect(typeNodeFromV1([...programPath, dateTime])).toStrictEqual(
            dateTimeTypeNode(integerTypeNode('i64'), { ticksPerSecond: 1000 }),
        );
        expect(typeNodeFromV1([...programPath, duration])).toStrictEqual(durationTypeNode(integerTypeNode('u32')));
    });

    test('it drops date-time displays on floats', () => {
        const type = {
            display: { kind: 'dateTimeNumberDisplayNode' },
            endian: 'le',
            format: 'f64',
            kind: 'numberTypeNode',
        } as v1.NumberTypeNode;
        expect(typeNodeFromV1([...programPath, type])).toStrictEqual(floatTypeNode('f64'));
    });
});

describe('integer positions', () => {
    test('it drops date-time and duration displays where only integers are accepted', () => {
        const prefix = {
            display: { kind: 'dateTimeNumberDisplayNode' },
            endian: 'le',
            format: 'u32',
            kind: 'numberTypeNode',
        } as v1.NumberTypeNode;
        expect(integerTypeNodeFromV1([...programPath, prefix])).toStrictEqual(integerTypeNode('u32'));
    });

    test('it keeps the wrappers of integers as transforms', () => {
        const prefix = {
            kind: 'fixedSizeTypeNode',
            size: 8,
            type: { endian: 'le', format: 'u32', kind: 'numberTypeNode' },
        } as v1.FixedSizeTypeNode<v1.NumberTypeNode>;
        expect(integerTypeNodeFromV1([...programPath, prefix])).toStrictEqual(
            integerTypeNode('u32', { transforms: [fixedSizeTransformNode(8)] }),
        );
    });

    test('it throws on floats where only integers are accepted', () => {
        const prefix = { endian: 'le', format: 'f32', kind: 'numberTypeNode' } as v1.NumberTypeNode;
        expect(() => integerTypeNodeFromV1([...programPath, prefix])).toThrow(
            new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
                expectedKinds: ['integerTypeNode'],
                kind: 'floatTypeNode',
                node: floatTypeNode('f32'),
            }),
        );
    });

    test('it converts the integer positions of types', () => {
        const boolean = {
            kind: 'booleanTypeNode',
            size: { endian: 'le', format: 'u32', kind: 'numberTypeNode' },
        } as v1.BooleanTypeNode;
        const option = {
            fixed: true,
            item: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
            kind: 'optionTypeNode',
            prefix: { endian: 'le', format: 'u16', kind: 'numberTypeNode' },
        } as v1.OptionTypeNode;
        const array = {
            count: { kind: 'prefixedCountNode', prefix: { endian: 'le', format: 'u16', kind: 'numberTypeNode' } },
            item: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
            kind: 'arrayTypeNode',
        } as v1.ArrayTypeNode;
        expect(typeNodeFromV1([...programPath, boolean])).toStrictEqual(
            booleanTypeNode({ size: integerTypeNode('u32') }),
        );
        expect(typeNodeFromV1([...programPath, option])).toStrictEqual(
            optionTypeNode(integerTypeNode('u8'), { fixed: true, prefix: integerTypeNode('u16') }),
        );
        expect(typeNodeFromV1([...programPath, array])).toStrictEqual(
            arrayTypeNode(integerTypeNode('u8'), prefixedCountNode(integerTypeNode('u16'))),
        );
    });
});

describe('wrappers', () => {
    test('it turns wrappers into transforms, innermost first', () => {
        // Given a fixed-size string delimited by a sentinel.
        const type = {
            kind: 'fixedSizeTypeNode',
            size: 32,
            type: {
                kind: 'sentinelTypeNode',
                sentinel: {
                    kind: 'constantValueNode',
                    type: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                    value: { kind: 'numberValueNode', number: 255 },
                },
                type: { encoding: 'utf8', kind: 'stringTypeNode' },
            },
        } as v1.FixedSizeTypeNode;

        // Then the sentinel is applied first.
        expect(typeNodeFromV1([...programPath, type])).toStrictEqual(
            stringTypeNode('utf8', {
                transforms: [
                    sentinelTransformNode(constantValueNode(integerTypeNode('u8'), integerValueNode('255'))),
                    fixedSizeTransformNode(32),
                ],
            }),
        );
    });

    test('it converts every wrapper', () => {
        const type = {
            kind: 'sizePrefixTypeNode',
            prefix: { endian: 'le', format: 'u32', kind: 'numberTypeNode' },
            type: {
                kind: 'postOffsetTypeNode',
                offset: 2,
                strategy: 'padded',
                type: {
                    kind: 'preOffsetTypeNode',
                    offset: -1,
                    strategy: 'absolute',
                    type: {
                        kind: 'hiddenSuffixTypeNode',
                        suffix: [
                            {
                                kind: 'constantValueNode',
                                type: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                                value: { kind: 'numberValueNode', number: 2 },
                            },
                        ],
                        type: {
                            kind: 'hiddenPrefixTypeNode',
                            prefix: [
                                {
                                    kind: 'constantValueNode',
                                    type: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                                    value: { kind: 'numberValueNode', number: 1 },
                                },
                            ],
                            type: { kind: 'bytesTypeNode' },
                        },
                    },
                },
            },
        } as v1.SizePrefixTypeNode;
        expect(typeNodeFromV1([...programPath, type])).toStrictEqual(
            bytesTypeNode({
                transforms: [
                    hiddenPrefixTransformNode([constantValueNode(integerTypeNode('u8'), integerValueNode('1'))]),
                    hiddenSuffixTransformNode([constantValueNode(integerTypeNode('u8'), integerValueNode('2'))]),
                    preOffsetTransformNode(-1, { strategy: 'absolute' }),
                    postOffsetTransformNode(2, { strategy: 'padded' }),
                    sizePrefixTransformNode(integerTypeNode('u32')),
                ],
            }),
        );
    });

    test('it puts the transforms of wrapped links on the links', () => {
        const type = {
            kind: 'fixedSizeTypeNode',
            size: 4,
            type: { kind: 'definedTypeLinkNode', name: 'myType', program: { kind: 'programLinkNode', name: 'other' } },
        } as v1.FixedSizeTypeNode;
        expect(typeNodeFromV1([...programPath, type])).toStrictEqual(
            definedTypeLinkNode('myType', {
                program: programLinkNode('other'),
                transforms: [fixedSizeTransformNode(4)],
            }),
        );
    });
});

describe('quantities', () => {
    test('it turns amounts into fixed points', () => {
        const amount = {
            decimals: 6,
            kind: 'amountTypeNode',
            number: { endian: 'le', format: 'u64', kind: 'numberTypeNode' },
            unit: 'USDC',
        } as v1.AmountTypeNode;
        const solAmount = {
            kind: 'solAmountTypeNode',
            number: { endian: 'le', format: 'u64', kind: 'numberTypeNode' },
        } as v1.SolAmountTypeNode;
        expect(typeNodeFromV1([...programPath, amount])).toStrictEqual(
            fixedPointTypeNode(integerTypeNode('u64'), 6, { unit: 'USDC' }),
        );
        expect(typeNodeFromV1([...programPath, solAmount])).toStrictEqual(
            fixedPointTypeNode(integerTypeNode('u64'), 9, { unit: 'SOL' }),
        );
    });

    test('it turns amounts without decimals into integers with a unit', () => {
        const type = {
            decimals: 0,
            kind: 'amountTypeNode',
            number: { endian: 'le', format: 'u64', kind: 'numberTypeNode' },
            unit: 'slots',
        } as v1.AmountTypeNode;
        expect(typeNodeFromV1([...programPath, type])).toStrictEqual(integerTypeNode('u64', { unit: 'slots' }));
    });

    test('it moves the wrappers of quantity numbers onto the quantity', () => {
        const type = {
            decimals: 2,
            kind: 'amountTypeNode',
            number: {
                kind: 'fixedSizeTypeNode',
                size: 16,
                type: { endian: 'le', format: 'u64', kind: 'numberTypeNode' },
            },
        } as v1.AmountTypeNode;
        expect(typeNodeFromV1([...programPath, type])).toStrictEqual(
            fixedPointTypeNode(integerTypeNode('u64'), 2, { transforms: [fixedSizeTransformNode(16)] }),
        );
    });

    test('it scales variable-size amounts through an amount display', () => {
        const type = {
            decimals: 2,
            kind: 'amountTypeNode',
            number: { endian: 'le', format: 'shortU16', kind: 'numberTypeNode' },
            unit: '$',
        } as v1.AmountTypeNode;
        expect(typeNodeFromV1([...programPath, type])).toStrictEqual(
            integerTypeNode('shortU16', {
                display: amountNumberDisplayNode({ decimals: integerValueNode('2'), unit: stringValueNode('$') }),
            }),
        );
    });

    test('it only keeps the unit of float amounts', () => {
        const type = {
            decimals: 2,
            kind: 'amountTypeNode',
            number: { endian: 'le', format: 'f64', kind: 'numberTypeNode' },
            unit: '%',
        } as v1.AmountTypeNode;
        expect(typeNodeFromV1([...programPath, type])).toStrictEqual(floatTypeNode('f64', { unit: '%' }));
    });

    test('it merges the ticks of date-time displays into date-time types', () => {
        const withTicks = {
            kind: 'dateTimeTypeNode',
            number: {
                display: { kind: 'dateTimeNumberDisplayNode', ticksPerSecond: 1000 },
                endian: 'le',
                format: 'i64',
                kind: 'numberTypeNode',
            },
        } as v1.DateTimeTypeNode;
        const withoutTicks = {
            kind: 'dateTimeTypeNode',
            number: { endian: 'le', format: 'i64', kind: 'numberTypeNode' },
        } as v1.DateTimeTypeNode;
        expect(typeNodeFromV1([...programPath, withTicks])).toStrictEqual(
            dateTimeTypeNode(integerTypeNode('i64'), { ticksPerSecond: 1000 }),
        );
        expect(typeNodeFromV1([...programPath, withoutTicks])).toStrictEqual(dateTimeTypeNode(integerTypeNode('i64')));
    });

    test('it drops the amount and duration displays of date-time numbers', () => {
        const withAmount = {
            kind: 'dateTimeTypeNode',
            number: {
                display: {
                    decimals: { kind: 'numberValueNode', number: 2 },
                    kind: 'amountNumberDisplayNode',
                    unit: { kind: 'stringValueNode', string: 'USD' },
                },
                endian: 'le',
                format: 'i64',
                kind: 'numberTypeNode',
            },
        } as v1.DateTimeTypeNode;
        const withDuration = {
            kind: 'dateTimeTypeNode',
            number: {
                kind: 'fixedSizeTypeNode',
                size: 8,
                type: {
                    display: { kind: 'durationNumberDisplayNode', ticksPerSecond: 1000 },
                    endian: 'le',
                    format: 'i64',
                    kind: 'numberTypeNode',
                },
            },
        } as v1.DateTimeTypeNode;
        expect(typeNodeFromV1([...programPath, withAmount])).toStrictEqual(dateTimeTypeNode(integerTypeNode('i64')));
        expect(typeNodeFromV1([...programPath, withDuration])).toStrictEqual(
            dateTimeTypeNode(integerTypeNode('i64'), { transforms: [fixedSizeTransformNode(8)] }),
        );
    });

    test('it turns float date-times into floats', () => {
        const type = {
            kind: 'dateTimeTypeNode',
            number: { endian: 'le', format: 'f64', kind: 'numberTypeNode' },
        } as v1.DateTimeTypeNode;
        expect(typeNodeFromV1([...programPath, type])).toStrictEqual(floatTypeNode('f64'));
    });
});

describe('enums', () => {
    test('it unifies enum variants', () => {
        const type = {
            kind: 'enumTypeNode',
            size: { endian: 'le', format: 'u16', kind: 'numberTypeNode' },
            variants: [
                {
                    discriminator: 5,
                    display: { kind: 'enumVariantDisplayNode', label: 'Flip' },
                    kind: 'enumEmptyVariantTypeNode',
                    name: 'flip',
                },
                {
                    kind: 'enumStructVariantTypeNode',
                    name: 'move',
                    struct: {
                        fields: [
                            {
                                kind: 'structFieldTypeNode',
                                name: 'x',
                                type: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
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
                            { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                            { endian: 'le', format: 'u32', kind: 'numberTypeNode' },
                        ],
                        kind: 'tupleTypeNode',
                    },
                },
            ],
        } as v1.EnumTypeNode;
        expect(typeNodeFromV1([...programPath, type])).toStrictEqual(
            enumTypeNode(
                [
                    enumVariantTypeNode('flip', {
                        discriminator: 5,
                        display: enumVariantDisplayNode({ label: 'Flip' }),
                    }),
                    enumVariantTypeNode('move', {
                        data: structTypeNode([structFieldTypeNode({ identifier: 'x', type: integerTypeNode('u8') })]),
                    }),
                    enumVariantTypeNode('pair', {
                        data: tupleTypeNode([integerTypeNode('u8'), integerTypeNode('u32')]),
                    }),
                ],
                { size: integerTypeNode('u16') },
            ),
        );
    });

    test('it keeps 1-tuple variants as tuples', () => {
        const type = {
            kind: 'enumTypeNode',
            size: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
            variants: [
                {
                    kind: 'enumTupleVariantTypeNode',
                    name: 'amount',
                    tuple: { items: [{ endian: 'le', format: 'u64', kind: 'numberTypeNode' }], kind: 'tupleTypeNode' },
                },
                {
                    kind: 'enumTupleVariantTypeNode',
                    name: 'struct',
                    tuple: { items: [{ fields: [], kind: 'structTypeNode' }], kind: 'tupleTypeNode' },
                },
                {
                    kind: 'enumTupleVariantTypeNode',
                    name: 'link',
                    tuple: { items: [{ kind: 'definedTypeLinkNode', name: 'config' }], kind: 'tupleTypeNode' },
                },
            ],
        } as v1.EnumTypeNode;
        expect(typeNodeFromV1([...programPath, type])).toStrictEqual(
            enumTypeNode([
                enumVariantTypeNode('amount', { data: tupleTypeNode([integerTypeNode('u64')]) }),
                enumVariantTypeNode('struct', { data: tupleTypeNode([structTypeNode([])]) }),
                enumVariantTypeNode('link', { data: tupleTypeNode([definedTypeLinkNode('config')]) }),
            ]),
        );
    });

    test('it keeps the transforms of 1-tuple variants on their tuple', () => {
        // Given a fixed-size 1-tuple holding a size-prefixed string.
        const type = {
            kind: 'enumTypeNode',
            size: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
            variants: [
                {
                    kind: 'enumTupleVariantTypeNode',
                    name: 'label',
                    tuple: {
                        kind: 'fixedSizeTypeNode',
                        size: 36,
                        type: {
                            items: [
                                {
                                    kind: 'sizePrefixTypeNode',
                                    prefix: { endian: 'le', format: 'u32', kind: 'numberTypeNode' },
                                    type: { encoding: 'utf8', kind: 'stringTypeNode' },
                                },
                            ],
                            kind: 'tupleTypeNode',
                        },
                    },
                },
            ],
        } as v1.EnumTypeNode;

        // Then the tuple keeps its own transforms and the item keeps its own.
        expect(typeNodeFromV1([...programPath, type])).toStrictEqual(
            enumTypeNode([
                enumVariantTypeNode('label', {
                    data: tupleTypeNode(
                        [stringTypeNode('utf8', { transforms: [sizePrefixTransformNode(integerTypeNode('u32'))] })],
                        { transforms: [fixedSizeTransformNode(36)] },
                    ),
                }),
            ]),
        );
    });
});

describe('other types', () => {
    test('it converts struct fields', () => {
        const type = {
            fields: [
                {
                    defaultValue: { kind: 'numberValueNode', number: 42 },
                    defaultValueStrategy: 'omitted',
                    display: { kind: 'structFieldDisplayNode', label: 'Amount', skip: 'always' },
                    docs: ['The amount.', 'In lamports.'],
                    kind: 'structFieldTypeNode',
                    name: 'amount',
                    type: { endian: 'le', format: 'u64', kind: 'numberTypeNode' },
                },
            ],
            kind: 'structTypeNode',
        } as v1.StructTypeNode;
        expect(typeNodeFromV1([...programPath, type])).toStrictEqual(
            structTypeNode([
                structFieldTypeNode({
                    defaultValue: integerValueNode('42'),
                    defaultValueStrategy: 'omitted',
                    display: structFieldDisplayNode({ label: 'Amount', skip: 'always' }),
                    docs: 'The amount.\nIn lamports.',
                    identifier: 'amount',
                    type: integerTypeNode('u64'),
                }),
            ]),
        );
    });

    test('it converts collections', () => {
        const set = {
            count: { kind: 'fixedCountNode', value: 3 },
            item: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
            kind: 'setTypeNode',
        } as v1.SetTypeNode;
        const map = {
            count: { kind: 'remainderCountNode' },
            key: { encoding: 'utf8', kind: 'stringTypeNode' },
            kind: 'mapTypeNode',
            value: { endian: 'le', format: 'u32', kind: 'numberTypeNode' },
        } as v1.MapTypeNode;
        expect(typeNodeFromV1([...programPath, set])).toStrictEqual(
            setTypeNode(integerTypeNode('u8'), fixedCountNode(3)),
        );
        expect(typeNodeFromV1([...programPath, map])).toStrictEqual(
            mapTypeNode(stringTypeNode('utf8'), integerTypeNode('u32'), remainderCountNode()),
        );
    });

    test('it converts options', () => {
        const remainderOption = {
            item: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
            kind: 'remainderOptionTypeNode',
        } as v1.RemainderOptionTypeNode;
        const zeroableOption = {
            item: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
            kind: 'zeroableOptionTypeNode',
            zeroValue: {
                kind: 'constantValueNode',
                type: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                value: { kind: 'numberValueNode', number: 255 },
            },
        } as v1.ZeroableOptionTypeNode;
        expect(typeNodeFromV1([...programPath, remainderOption])).toStrictEqual(
            remainderOptionTypeNode(integerTypeNode('u8')),
        );
        expect(typeNodeFromV1([...programPath, zeroableOption])).toStrictEqual(
            zeroableOptionTypeNode(integerTypeNode('u8'), {
                zeroValue: constantValueNode(integerTypeNode('u8'), integerValueNode('255')),
            }),
        );
    });

    test('it converts leaf types', () => {
        const string = {
            display: { kind: 'stringDisplayNode', sliceEnd: 8 },
            encoding: 'base58',
            kind: 'stringTypeNode',
        } as v1.StringTypeNode;
        expect(typeNodeFromV1([...programPath, { kind: 'publicKeyTypeNode' }])).toStrictEqual(publicKeyTypeNode());
        expect(typeNodeFromV1([...programPath, { kind: 'bytesTypeNode' }])).toStrictEqual(bytesTypeNode());
        expect(typeNodeFromV1([...programPath, string])).toStrictEqual(
            stringTypeNode('base58', { display: stringDisplayNode({ sliceEnd: 8 }) }),
        );
    });
});
