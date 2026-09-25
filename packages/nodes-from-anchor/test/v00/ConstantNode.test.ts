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

import { constantNodeFromAnchorV00, programNodeFromAnchorV00 } from '../../src';

test('it parses constant with number type and value', () => {
    // When we convert an integer constant.
    const node = constantNodeFromAnchorV00({
        name: 'max_size',
        type: 'u64',
        value: '1000',
    });

    // Then we expect an integer constant that keeps the IDL casing.
    expect(node).toEqual(constantNode('max_size', integerTypeNode('u64'), integerValueNode('1000')));
});

test('it parses large integer constants losslessly', () => {
    // When we convert an integer constant that does not fit in a JavaScript number.
    const node = constantNodeFromAnchorV00({
        name: 'max_supply',
        type: 'u128',
        value: '340282366920938463463374607431768211455',
    });

    // Then we expect the integer value to be preserved exactly.
    expect(node).toEqual(
        constantNode(
            'max_supply',
            integerTypeNode('u128'),
            integerValueNode('340282366920938463463374607431768211455'),
        ),
    );
});

test('it parses constant with float type and value', () => {
    // When we convert a float constant.
    const node = constantNodeFromAnchorV00({
        name: 'ratio',
        type: 'f64',
        value: '1.50',
    });

    // Then we expect a float constant with a canonical value.
    expect(node).toEqual(constantNode('ratio', floatTypeNode('f64'), floatValueNode('1.5')));
});

test('it parses constant with bytes type and value', () => {
    // When we convert a bytes constant.
    const node = constantNodeFromAnchorV00({
        name: 'seed_prefix',
        type: 'bytes',
        value: '[116, 101, 115, 116]', // "test" in bytes
    });

    // Then we expect a bytes constant encoded in base16.
    expect(node).toEqual(constantNode('seed_prefix', bytesTypeNode(), bytesValueNode('base16', '74657374')));
});

test('it parses constant with boolean type and value', () => {
    // When we convert a boolean constant.
    const node = constantNodeFromAnchorV00({
        name: 'is_active',
        type: 'bool',
        value: 'true',
    });

    // Then we expect a boolean constant.
    expect(node).toEqual(constantNode('is_active', booleanTypeNode(), booleanValueNode(true)));
});

test('it parses constant with publicKey type and value', () => {
    // When we convert a public key constant.
    const node = constantNodeFromAnchorV00({
        name: 'admin_key',
        type: 'publicKey',
        value: '11111111111111111111111111111111',
    });

    // Then we expect a public key constant.
    expect(node).toEqual(
        constantNode('admin_key', publicKeyTypeNode(), publicKeyValueNode('11111111111111111111111111111111')),
    );
});

test('it resolves linked defined types as raw string values', () => {
    // When we convert a constant whose type is a defined type link.
    const node = constantNodeFromAnchorV00({
        name: 'app_name',
        type: { defined: 'String' },
        value: 'MyApp',
    });

    // Then we expect the value to be kept as a raw string.
    expect(node).toEqual(constantNode('app_name', definedTypeLinkNode('String'), stringValueNode('MyApp')));
});

test('it handles malformed JSON in value gracefully', () => {
    // When we convert a bytes constant whose value is not valid JSON.
    const node = constantNodeFromAnchorV00({
        name: 'invalid_bytes',
        type: 'bytes',
        value: '[invalid json',
    });

    // Then we expect a string constant fallback.
    expect(node).toEqual(constantNode('invalid_bytes', stringTypeNode('utf8'), stringValueNode('[invalid json')));
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
    // When we convert a bytes constant whose value is not a valid byte array.
    const node = constantNodeFromAnchorV00({
        name: 'bad_bytes',
        type: 'bytes',
        value,
    });

    // Then we expect a string constant fallback.
    expect(node).toEqual(constantNode('bad_bytes', stringTypeNode('utf8'), stringValueNode(value)));
});

test('it parses constants in full program', () => {
    // When we convert a program with constants.
    const node = programNodeFromAnchorV00({
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
        name: 'my_program',
        version: '1.0.0',
    });

    // Then we expect the program to contain the converted constants.
    expect(node.constants).toEqual([
        constantNode('max_items', integerTypeNode('u32'), integerValueNode('100')),
        constantNode('seed_prefix', bytesTypeNode(), bytesValueNode('base16', '616263')),
    ]);
});

test.each([
    ['007.50', '7.5'],
    ['0.0000001', '0.0000001'],
    ['3.14159265358979323846', '3.14159265358979323846'],
    ['123456789012345678901.5', '123456789012345678901.5'],
])('it canonicalises float constants without losing precision (%s)', (value, expected) => {
    // When we convert a float constant.
    const node = constantNodeFromAnchorV00({ name: 'ratio', type: 'f64', value });

    // Then we expect its textually canonical value.
    expect(node).toEqual(constantNode('ratio', floatTypeNode('f64'), floatValueNode(expected)));
});
