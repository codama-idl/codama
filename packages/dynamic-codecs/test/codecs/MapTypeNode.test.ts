import { CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE, CodamaError } from '@codama/errors';
import {
    booleanTypeNode,
    bytesTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumTypeNode,
    enumVariantTypeNode,
    fixedCountNode,
    fixedSizeTransformNode,
    floatTypeNode,
    integerTypeNode,
    integerValueNode,
    mapEntryValueNode,
    mapTypeNode,
    mapValueNode,
    optionTypeNode,
    prefixedCountNode,
    programNode,
    remainderCountNode,
    rootNode,
    stringTypeNode,
    structFieldTypeNode,
    structFieldValueNode,
    structTypeNode,
    structValueNode,
    tupleTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../src';
import { hex } from '../_setup';

const key = stringTypeNode('utf8', { transforms: [fixedSizeTransformNode(3)] });
const value = integerTypeNode('u16');
// eslint-disable-next-line sort-keys
const map = { foo: 42, bar: 99, baz: 650 };
// eslint-disable-next-line sort-keys
const decodedMap = { foo: 42n, bar: 99n, baz: 650n };

test('it decodes prefixed maps as objects', () => {
    const codec = getNodeValueCodec([mapTypeNode(key, value, prefixedCountNode(integerTypeNode('u32')))]);
    expect(codec.encode(map)).toStrictEqual(hex('03000000666f6f2a00626172630062617a8a02'));
    expect(codec.decode(hex('03000000666f6f2a00626172630062617a8a02'))).toStrictEqual(decodedMap);
});

test('it decodes fixed maps as objects', () => {
    const codec = getNodeValueCodec([mapTypeNode(key, value, fixedCountNode(3))]);
    expect(codec.encode(map)).toStrictEqual(hex('666f6f2a00626172630062617a8a02'));
    expect(codec.decode(hex('666f6f2a00626172630062617a8a02'))).toStrictEqual(decodedMap);
});

test('it decodes remainder maps as objects', () => {
    const codec = getNodeValueCodec([mapTypeNode(key, value, remainderCountNode())]);
    expect(codec.encode(map)).toStrictEqual(hex('666f6f2a00626172630062617a8a02'));
    expect(codec.decode(hex('666f6f2a00626172630062617a8a02'))).toStrictEqual(decodedMap);
});

test('it round-trips integer keys', () => {
    const codec = getNodeValueCodec([mapTypeNode(integerTypeNode('u64'), integerTypeNode('u8'), fixedCountNode(2))]);
    const bytes = hex('05000000000000000107000000000000000a');
    const decoded = codec.decode(bytes);
    expect(decoded).toStrictEqual({ 5: 1n, 7: 10n });
    expect(codec.encode(decoded)).toStrictEqual(bytes);
});

test('it round-trips boolean keys', () => {
    const codec = getNodeValueCodec([mapTypeNode(booleanTypeNode(), integerTypeNode('u8'), fixedCountNode(2))]);
    const bytes = hex('01010002');
    const decoded = codec.decode(bytes);
    expect(decoded).toStrictEqual({ false: 2n, true: 1n });
    expect(codec.encode(decoded)).toStrictEqual(bytes);
});

test('it round-trips float keys', () => {
    const codec = getNodeValueCodec([mapTypeNode(floatTypeNode('f32'), integerTypeNode('u8'), fixedCountNode(2))]);
    const bytes = hex('0000c03f01000080ff02');
    const decoded = codec.decode(bytes);
    expect(decoded).toStrictEqual({ '-Infinity': 2n, 1.5: 1n });
    expect(codec.encode(decoded)).toStrictEqual(bytes);
});

test('it round-trips negative zero float keys', () => {
    const codec = getNodeValueCodec([mapTypeNode(floatTypeNode('f32'), integerTypeNode('u8'), fixedCountNode(1))]);
    const bytes = hex('0000008001');
    const decoded = codec.decode(bytes);
    expect(decoded).toStrictEqual({ '-0': 1n });
    expect(codec.encode(decoded)).toStrictEqual(bytes);
});

test('it round-trips struct keys without collisions', () => {
    const point = structTypeNode([
        structFieldTypeNode({ identifier: 'y', type: integerTypeNode('u8') }),
        structFieldTypeNode({ identifier: 'x', type: integerTypeNode('u8') }),
    ]);
    const codec = getNodeValueCodec([mapTypeNode(point, integerTypeNode('u8'), fixedCountNode(2))]);
    const bytes = hex('01020a03040b');
    const decoded = codec.decode(bytes);
    expect(decoded).toStrictEqual({ '{"y":1,"x":2}': 10n, '{"y":3,"x":4}': 11n });
    expect(codec.encode(decoded)).toStrictEqual(bytes);
});

test('it round-trips tuple keys', () => {
    const pair = tupleTypeNode([
        integerTypeNode('u8'),
        stringTypeNode('utf8', { transforms: [fixedSizeTransformNode(2)] }),
    ]);
    const codec = getNodeValueCodec([mapTypeNode(pair, integerTypeNode('u8'), fixedCountNode(1))]);
    const bytes = hex('2a68690a');
    const decoded = codec.decode(bytes);
    expect(decoded).toStrictEqual({ '[42,"hi"]': 10n });
    expect(codec.encode(decoded)).toStrictEqual(bytes);
});

test('it round-trips enum keys, using the identifiers of variants without data', () => {
    const action = enumTypeNode([
        enumVariantTypeNode('quit'),
        enumVariantTypeNode('move', { data: integerTypeNode('u8') }),
    ]);
    const codec = getNodeValueCodec([mapTypeNode(action, integerTypeNode('u8'), fixedCountNode(2))]);
    const bytes = hex('000a01050b');
    const decoded = codec.decode(bytes);
    expect(decoded).toStrictEqual({ quit: 10n, '{"__discriminator":1,"__kind":"move","data":5}': 11n });
    expect(codec.encode(decoded)).toStrictEqual(bytes);
});

test('it round-trips option keys', () => {
    const codec = getNodeValueCodec([
        mapTypeNode(optionTypeNode(integerTypeNode('u8')), integerTypeNode('u8'), fixedCountNode(2)),
    ]);
    const bytes = hex('000a01050b');
    const decoded = codec.decode(bytes);
    expect(decoded).toStrictEqual({ '{"__option":"None"}': 10n, '{"__option":"Some","value":5}': 11n });
    expect(codec.encode(decoded)).toStrictEqual(bytes);
});

test('it round-trips bytes keys', () => {
    const key = bytesTypeNode({ transforms: [fixedSizeTransformNode(2)] });
    const codec = getNodeValueCodec([mapTypeNode(key, integerTypeNode('u8'), fixedCountNode(1))], {
        bytesEncoding: 'base16',
    });
    const bytes = hex('01020a');
    const decoded = codec.decode(bytes);
    expect(decoded).toStrictEqual({ '["base16","0102"]': 10n });
    expect(codec.encode(decoded)).toStrictEqual(bytes);
});

test('it round-trips non-finite and negative zero floats within complex keys', () => {
    const floats = tupleTypeNode([floatTypeNode('f64'), floatTypeNode('f64'), floatTypeNode('f64')]);
    const codec = getNodeValueCodec([mapTypeNode(floats, integerTypeNode('u8'), fixedCountNode(1))]);
    const bytes = hex('000000000000f87f000000000000f07f00000000000000800a');
    const decoded = codec.decode(bytes);
    expect(decoded).toStrictEqual({ '[NaN,Infinity,-0.0]': 10n });
    expect(codec.encode(decoded)).toStrictEqual(bytes);
});

test('it round-trips whole-number floats within complex keys', () => {
    // Given a float key of `1.0`, whose JSON form `[1]` parses back as the integer `1n`.
    const codec = getNodeValueCodec([
        mapTypeNode(tupleTypeNode([floatTypeNode('f64')]), integerTypeNode('u8'), fixedCountNode(1)),
    ]);
    const bytes = hex('000000000000f03f0a');
    const decoded = codec.decode(bytes);
    expect(decoded).toStrictEqual({ '[1]': 10n });
    expect(codec.encode(decoded)).toStrictEqual(bytes);
});

test('it round-trips integer keys beyond the safe integer range within complex keys', () => {
    const codec = getNodeValueCodec([
        mapTypeNode(tupleTypeNode([integerTypeNode('u64')]), integerTypeNode('u8'), fixedCountNode(1)),
    ]);
    const bytes = hex('ffffffffffffffff0a');
    const decoded = codec.decode(bytes);
    expect(decoded).toStrictEqual({ '[18446744073709551615]': 10n });
    expect(codec.encode(decoded)).toStrictEqual(bytes);
});

test('it parses keys using the type of linked key types', () => {
    // Given a numeric-looking key of a linked string type, which must not parse as an integer.
    const name = definedTypeNode({
        identifier: 'name',
        type: stringTypeNode('utf8', { transforms: [fixedSizeTransformNode(2)] }),
    });
    const map = mapTypeNode(definedTypeLinkNode('name'), integerTypeNode('u8'), fixedCountNode(1));
    const balances = definedTypeNode({ identifier: 'balances', type: map });
    const program = programNode({ definedTypes: [name, balances], identifier: 'myProgram', publicKey: '1111' });
    const root = rootNode(program);
    const codec = getNodeValueCodec([root, program, balances]);
    const bytes = hex('34320a');
    const decoded = codec.decode(bytes);
    expect(decoded).toStrictEqual({ 42: 10n });
    expect(codec.encode(decoded)).toStrictEqual(bytes);
});

test('it rejects keys that do not parse as their key type', () => {
    const keyType = integerTypeNode('u64');
    const map = mapTypeNode(keyType, integerTypeNode('u8'), fixedCountNode(1));
    expect(() => getNodeValueCodec([map]).encode({ abc: 1 })).toThrow(
        new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE, {
            actualType: "key 'abc'",
            expectedType: 'integer key',
            path: [map, keyType],
        }),
    );
});

test('it rejects boolean keys other than true and false', () => {
    const keyType = booleanTypeNode();
    const map = mapTypeNode(keyType, integerTypeNode('u8'), fixedCountNode(1));
    expect(() => getNodeValueCodec([map]).encode({ yes: 1 })).toThrow(
        new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE, {
            actualType: "key 'yes'",
            expectedType: "'true' | 'false'",
            path: [map, keyType],
        }),
    );
});

test('it rejects float keys that are not numbers', () => {
    const keyType = floatTypeNode('f64');
    const map = mapTypeNode(keyType, integerTypeNode('u8'), fixedCountNode(1));
    expect(() => getNodeValueCodec([map]).encode({ abc: 1 })).toThrow(
        new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE, {
            actualType: "key 'abc'",
            expectedType: 'number key',
            path: [map, keyType],
        }),
    );
});

test('it rejects complex keys that are not valid JSON', () => {
    const keyType = tupleTypeNode([integerTypeNode('u8')]);
    const map = mapTypeNode(keyType, integerTypeNode('u8'), fixedCountNode(1));
    expect(() => getNodeValueCodec([map]).encode({ '[1,': 1 })).toThrow(
        new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE, {
            actualType: "key '[1,'",
            expectedType: 'JSON key',
            path: [map, keyType],
        }),
    );
});

test('it rejects complex keys with trailing characters', () => {
    const keyType = tupleTypeNode([integerTypeNode('u8')]);
    const map = mapTypeNode(keyType, integerTypeNode('u8'), fixedCountNode(1));
    expect(() => getNodeValueCodec([map]).encode({ '[1]x': 1 })).toThrow(
        new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE, {
            actualType: "key '[1]x'",
            expectedType: 'JSON key',
            path: [map, keyType],
        }),
    );
});

test('it reports the path of linked key types through their definitions', () => {
    const idType = integerTypeNode('u64');
    const id = definedTypeNode({ identifier: 'id', type: idType });
    const map = mapTypeNode(definedTypeLinkNode('id'), integerTypeNode('u8'), fixedCountNode(1));
    const balances = definedTypeNode({ identifier: 'balances', type: map });
    const program = programNode({ definedTypes: [id, balances], identifier: 'myProgram', publicKey: '1111' });
    const root = rootNode(program);
    expect(() => getNodeValueCodec([root, program, balances]).encode({ abc: 1 })).toThrow(
        new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE, {
            actualType: "key 'abc'",
            expectedType: 'integer key',
            path: [root, program, id, idType],
        }),
    );
});

test('it encodes map default values with non-string keys', () => {
    const map = mapTypeNode(integerTypeNode('u64'), integerTypeNode('u8'), fixedCountNode(1));
    const defaultValue = mapValueNode([mapEntryValueNode(integerValueNode('5'), integerValueNode('10'))]);
    const struct = structTypeNode([structFieldTypeNode({ defaultValue, identifier: 'balances', type: map })]);
    expect(getNodeValueCodec([struct]).encode({})).toStrictEqual(hex('05000000000000000a'));
});

test('it encodes map default values with struct keys', () => {
    const point = structTypeNode([
        structFieldTypeNode({ identifier: 'x', type: integerTypeNode('u8') }),
        structFieldTypeNode({ identifier: 'y', type: integerTypeNode('u8') }),
    ]);
    const map = mapTypeNode(point, integerTypeNode('u8'), fixedCountNode(1));
    const key = structValueNode([
        structFieldValueNode('x', integerValueNode('1')),
        structFieldValueNode('y', integerValueNode('2')),
    ]);
    const defaultValue = mapValueNode([mapEntryValueNode(key, integerValueNode('10'))]);
    const struct = structTypeNode([structFieldTypeNode({ defaultValue, identifier: 'points', type: map })]);
    expect(getNodeValueCodec([struct]).encode({})).toStrictEqual(hex('01020a'));
});
