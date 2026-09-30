import { CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE } from '@codama/errors';
import {
    arrayTypeNode,
    booleanTypeNode,
    bytesTypeNode,
    dateTimeTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumTypeNode,
    enumVariantTypeNode,
    floatTypeNode,
    instructionNode,
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
function valueTypeError(context: {
    actualType: string;
    expectedType: string;
    nodeKind: Node['kind'];
    nodePath: readonly Node[];
}) {
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
            expect(() => codec.encode(value)).toThrow(
                valueTypeError({ actualType, expectedType, nodeKind: node.kind, nodePath: [node] }),
            );
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
                nodeKind: 'integerTypeNode',
                nodePath: [struct, amount, u8],
            }),
        );
    });
});

describe('node paths', () => {
    const integerError = (nodePath: readonly Node[]) =>
        valueTypeError({
            actualType: 'string',
            expectedType: 'integer (number | bigint)',
            nodeKind: 'integerTypeNode',
            nodePath,
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
