import {
    booleanTypeNode,
    booleanValueNode,
    bytesTypeNode,
    bytesValueNode,
    constantNode,
    definedTypeLinkNode,
    numberTypeNode,
    numberValueNode,
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
            name: 'max_size',
            type: 'u64',
            value: '1000',
        },
        generics,
    );

    expect(node).toEqual(constantNode('maxSize', numberTypeNode('u64'), numberValueNode(1000)));
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

    expect(node).toEqual(constantNode('seedPrefix', bytesTypeNode(), bytesValueNode('base16', '74657374')));
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

    expect(node).toEqual(constantNode('negConst', numberTypeNode('i8'), numberValueNode(-5)));
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

    expect(node).toEqual(constantNode('isActive', booleanTypeNode(), booleanValueNode(true)));
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
        constantNode('adminKey', publicKeyTypeNode(), publicKeyValueNode('11111111111111111111111111111111')),
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

    expect(node).toEqual(constantNode('appName', definedTypeLinkNode('String'), stringValueNode('MyApp')));
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

    expect(node).toEqual(constantNode('badConstant', stringTypeNode('utf8'), stringValueNode('[invalid json')));
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

    expect(node).toEqual(constantNode('badBytes', stringTypeNode('utf8'), stringValueNode(value)));
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
    expect(node.constants[0]).toEqual(constantNode('maxItems', numberTypeNode('u32'), numberValueNode(100)));
    expect(node.constants[1]).toEqual(constantNode('seedPrefix', bytesTypeNode(), bytesValueNode('base16', '616263')));
});
