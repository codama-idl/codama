import {
    booleanTypeNode,
    booleanValueNode,
    bytesTypeNode,
    bytesValueNode,
    constantNode,
    definedTypeLinkNode,
    floatTypeNode,
    floatValueNode,
    integerTypeNode,
    integerValueNode,
    publicKeyTypeNode,
    publicKeyValueNode,
    stringTypeNode,
    stringValueNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { constantNodeFromAnchorV01, GenericsV01, programNodeFromAnchorV01 } from '../../src';

const generics = {} as GenericsV01;

test('it parses constant with number type and value', () => {
    const node = constantNodeFromAnchorV01(
        {
            name: 'MAX_SIZE',
            type: 'u64',
            value: '1000',
        },
        generics,
    );

    expect(node).toEqual(constantNode('MAX_SIZE', integerTypeNode('u64'), integerValueNode('1000')));
    expect(node.identifier).toBe('MAX_SIZE');
});

test('it parses constant with bytes type and value', () => {
    const node = constantNodeFromAnchorV01(
        {
            name: 'seed_prefix',
            type: 'bytes',
            value: '[116, 101, 115, 116]', // "test" in bytes
        },
        generics,
    );

    expect(node).toEqual(constantNode('seed_prefix', bytesTypeNode(), bytesValueNode('base16', '74657374')));
});

test('it parses constant with negative numeric value', () => {
    const node = constantNodeFromAnchorV01(
        {
            name: 'neg_const',
            type: 'i8',
            value: '-5',
        },
        generics,
    );

    expect(node).toEqual(constantNode('neg_const', integerTypeNode('i8'), integerValueNode('-5')));
});

test('it parses constant with boolean type and value', () => {
    const node = constantNodeFromAnchorV01(
        {
            name: 'is_active',
            type: 'bool',
            value: 'true',
        },
        generics,
    );

    expect(node).toEqual(constantNode('is_active', booleanTypeNode(), booleanValueNode(true)));
});

test('it parses constant with pubkey type and value', () => {
    const node = constantNodeFromAnchorV01(
        {
            name: 'admin_key',
            type: 'pubkey',
            value: '11111111111111111111111111111111',
        },
        generics,
    );

    expect(node).toEqual(
        constantNode('admin_key', publicKeyTypeNode(), publicKeyValueNode('11111111111111111111111111111111')),
    );
});

test('it resolves linked defined types as raw string values', () => {
    const node = constantNodeFromAnchorV01(
        {
            name: 'app_name',
            type: { defined: { name: 'String' } },
            value: 'MyApp',
        },
        generics,
    );

    expect(node).toEqual(constantNode('app_name', definedTypeLinkNode('String'), stringValueNode('MyApp')));
});

test('it handles malformed JSON in value gracefully', () => {
    const node = constantNodeFromAnchorV01(
        {
            name: 'bad_constant',
            type: 'bytes',
            value: '[invalid json',
        },
        generics,
    );

    expect(node).toEqual(constantNode('bad_constant', stringTypeNode('utf8'), stringValueNode('[invalid json')));
});

test.each([
    ['out-of-range byte', '[999]'],
    ['negative byte', '[-1]'],
    ['fractional byte', '[1.5]'],
    ['non-numeric element', '["x"]'],
    ['non-array JSON (number)', '999'],
    ['non-array JSON (string)', '"abc"'],
    ['non-array JSON (null)', 'null'],
])('it rejects invalid byte array (%s) and falls back to string', (_label, value) => {
    const node = constantNodeFromAnchorV01(
        {
            name: 'bad_bytes',
            type: 'bytes',
            value,
        },
        generics,
    );

    expect(node).toEqual(constantNode('bad_bytes', stringTypeNode('utf8'), stringValueNode(value)));
});

test('it parses 64-bit and 128-bit integer constants losslessly', () => {
    const u64 = constantNodeFromAnchorV01({ name: 'MAX_U64', type: 'u64', value: '18446744073709551615' }, generics);
    const i128 = constantNodeFromAnchorV01(
        { name: 'MIN_I128', type: 'i128', value: '-170141183460469231731687303715884105728' },
        generics,
    );

    expect(u64).toEqual(constantNode('MAX_U64', integerTypeNode('u64'), integerValueNode('18446744073709551615')));
    expect(i128).toEqual(
        constantNode('MIN_I128', integerTypeNode('i128'), integerValueNode('-170141183460469231731687303715884105728')),
    );
});

test('it normalises integer constants', () => {
    const node = constantNodeFromAnchorV01({ name: 'padded', type: 'u8', value: '007' }, generics);

    expect(node).toEqual(constantNode('padded', integerTypeNode('u8'), integerValueNode('7')));
});

test('it falls back to string for non-integer values of integer constants', () => {
    const node = constantNodeFromAnchorV01({ name: 'expr', type: 'u64', value: '10 * 1000' }, generics);

    expect(node).toEqual(constantNode('expr', stringTypeNode('utf8'), stringValueNode('10 * 1000')));
});

test('it parses float constants', () => {
    const node = constantNodeFromAnchorV01({ name: 'ratio', type: 'f64', value: '1.50' }, generics);

    expect(node).toEqual(constantNode('ratio', floatTypeNode('f64'), floatValueNode('1.5')));
});

test('it falls back to string for non-decimal values of float constants', () => {
    const node = constantNodeFromAnchorV01({ name: 'ratio', type: 'f32', value: '1e3' }, generics);

    expect(node).toEqual(constantNode('ratio', stringTypeNode('utf8'), stringValueNode('1e3')));
});

test('it falls back to string for non-boolean values of boolean constants', () => {
    const node = constantNodeFromAnchorV01({ name: 'flag', type: 'bool', value: 'yes' }, generics);

    expect(node).toEqual(constantNode('flag', stringTypeNode('utf8'), stringValueNode('yes')));
});

test('it parses constants in full program', () => {
    const node = programNodeFromAnchorV01({
        address: '1111',
        constants: [
            {
                name: 'max_items',
                type: 'u32',
                value: '100',
            },
            {
                name: 'seed_prefix',
                type: 'bytes',
                value: '[97, 98, 99]', // "abc"
            },
        ],
        instructions: [],
        metadata: { name: 'my_program', spec: '0.1.0', version: '1.0.0' },
    });

    expect(node.constants).toHaveLength(2);
    expect((node.constants ?? [])[0]).toEqual(
        constantNode('max_items', integerTypeNode('u32'), integerValueNode('100')),
    );
    expect((node.constants ?? [])[1]).toEqual(
        constantNode('seed_prefix', bytesTypeNode(), bytesValueNode('base16', '616263')),
    );
});

test.each([
    ['007.50', '7.5'],
    ['0.0000001', '0.0000001'],
    ['3.14159265358979323846', '3.14159265358979323846'],
    ['123456789012345678901.5', '123456789012345678901.5'],
])('it canonicalises float constants without losing precision (%s)', (value, expected) => {
    // When we convert a float constant.
    const node = constantNodeFromAnchorV01({ name: 'ratio', type: 'f64', value }, generics);

    // Then we expect its textually canonical value.
    expect(node).toEqual(constantNode('ratio', floatTypeNode('f64'), floatValueNode(expected)));
});
