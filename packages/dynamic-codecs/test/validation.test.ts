import { CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE } from '@codama/errors';
import {
    arrayTypeNode,
    booleanTypeNode,
    bytesTypeNode,
    dateTimeTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    durationTypeNode,
    enumTypeNode,
    enumVariantTypeNode,
    fixedPointTypeNode,
    floatTypeNode,
    instructionNode,
    IntegerFormat,
    integerTypeNode,
    mapTypeNode,
    Node,
    optionTypeNode,
    prefixedCountNode,
    programNode,
    publicKeyTypeNode,
    RegisteredTypeNode,
    remainderOptionTypeNode,
    rootNode,
    setTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
    zeroableOptionTypeNode,
} from '@codama/nodes';
import { NodePath } from '@codama/visitors-core';
import { describe, expect, test } from 'vitest';

import { getNodeValueCodec } from '../src';
import { hex } from './_setup';

const u8 = integerTypeNode('u8');
const u16 = integerTypeNode('u16');
const u8Array = arrayTypeNode(u8, prefixedCountNode(integerTypeNode('u32')));

/** Match an `UNEXPECTED_VALUE_TYPE` error with exactly the given context. */
function valueTypeError(context: { actualType: string; expectedType: string; path: readonly Node[] }) {
    return expect.objectContaining({
        context: { __code: CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE, ...context },
    });
}

/** A short description of a value for test titles, e.g. `Map` or `'abc'`. */
function actualTypeOf(value: unknown): string {
    if (typeof value === 'object' && value !== null) return value.constructor?.name ?? 'object';
    return typeof value === 'string' ? `'${value}'` : String(value);
}

describe('value types', () => {
    const cases: [RegisteredTypeNode, unknown, string, string][] = [
        [u16, 'abc', 'integer (number | bigint)', 'string'],
        [u16, 1.5, 'integer (number | bigint)', 'number (1.5)'],
        [u16, null, 'integer (number | bigint)', 'null'],
        [u16, undefined, 'integer (number | bigint)', 'undefined'],
        [integerTypeNode('u64'), '12', 'integer (number | bigint)', 'string'],
        [floatTypeNode('f32'), 'abc', 'number | bigint', 'string'],
        [booleanTypeNode(), 'no', 'boolean', 'string'],
        [stringTypeNode('utf8'), 42, 'string', 'number (42)'],
        [publicKeyTypeNode(), 'abc', 'Address', 'string'],
        [bytesTypeNode(), 'abc', 'Uint8Array | [BytesEncoding, string]', 'string'],
        [bytesTypeNode(), ['hex', '00'], 'Uint8Array | [BytesEncoding, string]', 'array (length 2)'],
        [u8Array, 'abc', 'array', 'string'],
        [setTypeNode(u8, prefixedCountNode(u16)), {}, 'array', 'object'],
        [tupleTypeNode([u8]), 42, 'array', 'number (42)'],
        [mapTypeNode(stringTypeNode('utf8'), u8, prefixedCountNode(u16)), [], 'object', 'array (length 0)'],
        [mapTypeNode(stringTypeNode('utf8'), u8, prefixedCountNode(u16)), new Map([['a', 1]]), 'object', 'object'],
        [structTypeNode([]), null, 'object', 'null'],
        [structTypeNode([]), new Date(0), 'object', 'object'],
        [structTypeNode([]), new Set(), 'object', 'object'],
        [enumVariantTypeNode('quit'), 42, "{ __kind: 'quit' }", 'number (42)'],
        [enumVariantTypeNode('quit'), { __kind: 'move' }, "{ __kind: 'quit' }", "variant 'move'"],
        [enumVariantTypeNode('move', { data: u8 }), 42, "{ __kind: 'move', data }", 'number (42)'],
        [
            enumVariantTypeNode('move', { data: u8 }),
            { __kind: 'quit', data: 1 },
            "{ __kind: 'move', data }",
            "variant 'quit'",
        ],
        [enumTypeNode([enumVariantTypeNode('quit')]), 42, 'string | { __kind: string }', 'number (42)'],
    ];

    test.each(cases.map(([node, value, ...rest]) => [node.kind, actualTypeOf(value), node, value, ...rest] as const))(
        '%s rejects %s',
        (_kind, _title, node, value, expectedType, actualType) => {
            const codec = getNodeValueCodec([node] as NodePath<RegisteredTypeNode>);
            expect(() => codec.encode(value)).toThrow(valueTypeError({ actualType, expectedType, path: [node] }));
        },
    );

    test('it accepts plain objects without prototypes', () => {
        const struct = structTypeNode([structFieldTypeNode({ identifier: 'amount', type: u8 })]);
        const value = Object.assign(Object.create(null) as object, { amount: 42 });
        expect(getNodeValueCodec([struct]).encode(value)).toStrictEqual(hex('2a'));
    });

    test('it accepts integers as numbers or bigints', () => {
        const codec = getNodeValueCodec([u16]);
        expect(codec.encode(42)).toStrictEqual(hex('2a00'));
        expect(codec.encode(42n)).toStrictEqual(hex('2a00'));
    });

    test('it encodes missing options as None', () => {
        expect(getNodeValueCodec([optionTypeNode(u8)]).encode(undefined)).toStrictEqual(hex('00'));
        expect(getNodeValueCodec([zeroableOptionTypeNode(u16)]).encode(undefined)).toStrictEqual(hex('0000'));
        expect(getNodeValueCodec([remainderOptionTypeNode(u8)]).encode(undefined)).toStrictEqual(hex(''));
        const struct = structTypeNode([structFieldTypeNode({ identifier: 'fee', type: optionTypeNode(u8) })]);
        expect(getNodeValueCodec([struct]).encode({})).toStrictEqual(hex('00'));
    });

    test('it rejects missing values of other types', () => {
        const amount = structFieldTypeNode({ identifier: 'amount', type: u8 });
        const struct = structTypeNode([amount]);
        expect(() => getNodeValueCodec([struct]).encode({})).toThrow(
            valueTypeError({
                actualType: 'undefined',
                expectedType: 'integer (number | bigint)',
                path: [struct, amount, u8],
            }),
        );
    });
});

describe('node paths', () => {
    const integerError = (path: readonly Node[]) =>
        valueTypeError({
            actualType: 'string',
            expectedType: 'integer (number | bigint)',
            path,
        });

    test('it reports the path of the rejecting node through structs, arrays and tuples', () => {
        // Given nested structs, arrays and tuples.
        const feeItem = integerTypeNode('u8');
        const fees = arrayTypeNode(feeItem, prefixedCountNode(integerTypeNode('u32')));
        const feesField = structFieldTypeNode({ identifier: 'fees', type: fees });
        const pairSecond = integerTypeNode('u8');
        const pair = tupleTypeNode([integerTypeNode('u8'), pairSecond]);
        const pairField = structFieldTypeNode({ identifier: 'pair', type: pair });
        const config = structTypeNode([feesField, pairField]);
        const configField = structFieldTypeNode({ identifier: 'config', type: config });
        const struct = structTypeNode([configField]);
        const codec = getNodeValueCodec([struct]);

        // Then errors report the path of the node that rejected the value.
        expect(() => codec.encode({ config: { fees: [1, 'x'], pair: [1, 2] } })).toThrow(
            integerError([struct, configField, config, feesField, fees, feeItem]),
        );
        expect(() => codec.encode({ config: { fees: [], pair: [1, 'x'] } })).toThrow(
            integerError([struct, configField, config, pairField, pair, pairSecond]),
        );
    });

    test('it reports paths from the root for instruction data', () => {
        const amountType = integerTypeNode('u16');
        const amount = structFieldTypeNode({ identifier: 'amount', type: amountType });
        const data = structTypeNode([amount]);
        const instruction = instructionNode({ data, identifier: 'transfer' });
        const program = programNode({ identifier: 'myProgram', instructions: [instruction], publicKey: '1111' });
        const root = rootNode(program);

        expect(() => getNodeValueCodec([root, program, instruction]).encode({ amount: 'x' })).toThrow(
            integerError([root, program, instruction, data, amount, amountType]),
        );
    });

    test('it reports paths through the definitions of linked types', () => {
        // Given a struct using a linked struct type.
        const feeType = integerTypeNode('u16');
        const fee = structFieldTypeNode({ identifier: 'fee', type: feeType });
        const configStruct = structTypeNode([fee]);
        const config = definedTypeNode({ identifier: 'config', type: configStruct });
        const struct = structTypeNode([
            structFieldTypeNode({ identifier: 'config', type: definedTypeLinkNode('config') }),
        ]);
        const account = definedTypeNode({ identifier: 'account', type: struct });
        const program = programNode({ definedTypes: [config, account], identifier: 'myProgram', publicKey: '1111' });
        const root = rootNode(program);

        // Then the path goes through the definition of the linked type.
        expect(() => getNodeValueCodec([root, program, account]).encode({ config: { fee: 'x' } })).toThrow(
            integerError([root, program, config, configStruct, fee, feeType]),
        );
    });

    test('it reports paths through options, enums, maps and date-times', () => {
        // Given fields of various types wrapping integers.
        const optionItem = integerTypeNode('u8');
        const option = optionTypeNode(optionItem);
        const optionField = structFieldTypeNode({ identifier: 'fee', type: option });
        const amountType = integerTypeNode('u8');
        const amount = structFieldTypeNode({ identifier: 'amount', type: amountType });
        const payload = structTypeNode([amount]);
        const move = enumVariantTypeNode('move', { data: payload });
        const enumType = enumTypeNode([move]);
        const enumField = structFieldTypeNode({ identifier: 'action', type: enumType });
        const mapValue = integerTypeNode('u8');
        const map = mapTypeNode(stringTypeNode('utf8'), mapValue, prefixedCountNode(u16));
        const mapField = structFieldTypeNode({ identifier: 'balances', type: map });
        const timestamp = integerTypeNode('i64');
        const dateTime = dateTimeTypeNode(timestamp);
        const dateTimeField = structFieldTypeNode({ identifier: 'createdAt', type: dateTime });
        const struct = structTypeNode([optionField, enumField, mapField, dateTimeField]);
        const codec = getNodeValueCodec([struct]);
        const valid = { action: { __kind: 'move', data: { amount: 1 } }, balances: {}, createdAt: 0, fee: null };

        // Then errors report the path of the node that rejected the value.
        expect(() => codec.encode({ ...valid, fee: 'x' })).toThrow(
            integerError([struct, optionField, option, optionItem]),
        );
        expect(() => codec.encode({ ...valid, action: { __kind: 'move', data: { amount: 'x' } } })).toThrow(
            integerError([struct, enumField, enumType, move, payload, amount, amountType]),
        );
        expect(() => codec.encode({ ...valid, balances: { alice: 'x' } })).toThrow(
            integerError([struct, mapField, map, mapValue]),
        );
        expect(() => codec.encode({ ...valid, createdAt: 'x' })).toThrow(
            integerError([struct, dateTimeField, dateTime, timestamp]),
        );
    });
});

describe('integer ranges', () => {
    test('it rejects u8 values above 255', () => {
        const u8Type = integerTypeNode('u8');
        expect(() => getNodeValueCodec([u8Type]).encode(256)).toThrow(
            valueTypeError({ actualType: 'number (256)', expectedType: 'integer between 0 and 255', path: [u8Type] }),
        );
    });

    test('it rejects i8 values below -128', () => {
        const i8Type = integerTypeNode('i8');
        expect(() => getNodeValueCodec([i8Type]).encode(-129)).toThrow(
            valueTypeError({
                actualType: 'number (-129)',
                expectedType: 'integer between -128 and 127',
                path: [i8Type],
            }),
        );
    });

    test('it rejects u64 bigints above the maximum u64', () => {
        const u64Type = integerTypeNode('u64');
        expect(() => getNodeValueCodec([u64Type]).encode(2n ** 64n)).toThrow(
            valueTypeError({
                actualType: 'bigint (18446744073709551616)',
                expectedType: 'integer between 0 and 18446744073709551615',
                path: [u64Type],
            }),
        );
    });

    test('it rejects negative shortU16 values', () => {
        const shortU16Type = integerTypeNode('shortU16');
        expect(() => getNodeValueCodec([shortU16Type]).encode(-1)).toThrow(
            valueTypeError({
                actualType: 'number (-1)',
                expectedType: 'integer between 0 and 65535',
                path: [shortU16Type],
            }),
        );
    });

    test.each([
        ['u8', 0n, 255n],
        ['u16', 0n, 65535n],
        ['u32', 0n, 2n ** 32n - 1n],
        ['u64', 0n, 2n ** 64n - 1n],
        ['u128', 0n, 2n ** 128n - 1n],
        ['i8', -128n, 127n],
        ['i16', -(2n ** 15n), 2n ** 15n - 1n],
        ['i32', -(2n ** 31n), 2n ** 31n - 1n],
        ['i64', -(2n ** 63n), 2n ** 63n - 1n],
        ['i128', -(2n ** 127n), 2n ** 127n - 1n],
        ['shortU16', 0n, 65535n],
    ] satisfies [IntegerFormat, bigint, bigint][])(
        '%s accepts its bounds and rejects values beyond them',
        (format, min, max) => {
            const integerType = integerTypeNode(format);
            const codec = getNodeValueCodec([integerType]);
            expect(codec.decode(codec.encode(min))).toBe(min);
            expect(codec.decode(codec.encode(max))).toBe(max);
            const expectedType = `integer between ${min} and ${max}`;
            expect(() => codec.encode(max + 1n)).toThrow(
                valueTypeError({ actualType: `bigint (${max + 1n})`, expectedType, path: [integerType] }),
            );
            expect(() => codec.encode(min - 1n)).toThrow(
                valueTypeError({ actualType: `bigint (${min - 1n})`, expectedType, path: [integerType] }),
            );
        },
    );

    test('it reports the path of nested out-of-range integers', () => {
        const feeType = integerTypeNode('u8');
        const fee = structFieldTypeNode({ identifier: 'fee', type: feeType });
        const configStruct = structTypeNode([fee]);
        const config = structFieldTypeNode({ identifier: 'config', type: configStruct });
        const struct = structTypeNode([config]);
        expect(() => getNodeValueCodec([struct]).encode({ config: { fee: 300 } })).toThrow(
            valueTypeError({
                actualType: 'number (300)',
                expectedType: 'integer between 0 and 255',
                path: [struct, config, configStruct, fee, feeType],
            }),
        );
    });

    test('it reports the path of out-of-range date-times', () => {
        const timestamp = integerTypeNode('u32');
        const dateTime = dateTimeTypeNode(timestamp);
        expect(() => getNodeValueCodec([dateTime]).encode(-1)).toThrow(
            valueTypeError({
                actualType: 'number (-1)',
                expectedType: 'integer between 0 and 4294967295',
                path: [dateTime, timestamp],
            }),
        );
    });

    test('it reports the path of out-of-range durations and fixed points', () => {
        const ticks = integerTypeNode('u8');
        const duration = durationTypeNode(ticks);
        expect(() => getNodeValueCodec([duration]).encode(256)).toThrow(
            valueTypeError({
                actualType: 'number (256)',
                expectedType: 'integer between 0 and 255',
                path: [duration, ticks],
            }),
        );
        const raw = integerTypeNode('i8');
        const fixedPoint = fixedPointTypeNode(raw, { scale: 2 });
        expect(() => getNodeValueCodec([fixedPoint]).encode(128n)).toThrow(
            valueTypeError({
                actualType: 'bigint (128)',
                expectedType: 'integer between -128 and 127',
                path: [fixedPoint, raw],
            }),
        );
    });
});
