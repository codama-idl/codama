import { bytesValueNode, constantNode, numberTypeNode, numberValueNode, stringValueNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { constantNodeFromAnchorV00, programNodeFromAnchorV00 } from '../../src';

test('it parses constant with number type and value', () => {
    const node = constantNodeFromAnchorV00({
        name: 'max_size',
        type: 'u64',
        value: '1000',
    });

    expect(node).toEqual(constantNode('maxSize', numberTypeNode('u64'), numberValueNode(1000)));
});

test('it parses constant with bytes type and value', () => {
    const node = constantNodeFromAnchorV00({
        name: 'seed_prefix',
        type: 'bytes',
        value: '[116, 101, 115, 116]', // "test" in bytes
    });

    expect(node).toEqual(constantNode('seedPrefix', numberTypeNode('u8'), bytesValueNode('base16', '74657374')));
});

test('it parses constant with string value', () => {
    const node = constantNodeFromAnchorV00({
        name: 'app_name',
        type: { defined: 'String' },
        value: 'MyApp',
    });

    // Type should be parsed, value should be string
    expect(node.name).toBe('appName');
    expect(node.value).toEqual(stringValueNode('MyApp'));
});

test('it handles malformed JSON in value gracefully', () => {
    const node = constantNodeFromAnchorV00({
        name: 'invalid_bytes',
        type: 'bytes',
        value: '[invalid json',
    });

    // Should fallback to string value
    expect(node.value).toEqual(stringValueNode('[invalid json'));
});

test('it parses constants in full program', () => {
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

    expect(node.constants).toHaveLength(2);
    expect(node.constants[0]).toEqual(constantNode('maxItems', numberTypeNode('u32'), numberValueNode(100)));
    expect(node.constants[1]).toEqual(
        constantNode('seedPrefix', numberTypeNode('u8'), bytesValueNode('base16', '616263')),
    );
});
