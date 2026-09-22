import { CODAMA_ERROR__INVALID_BRANDED_STRING, CodamaError } from '@codama/errors';
import { expect, test } from 'vitest';

import { constantNode, integerTypeNode, integerValueNode, stringTypeNode, stringValueNode } from '../src';

test('it returns the right node kind', () => {
    const node = constantNode('myConstant', integerTypeNode('u32'), integerValueNode('42'));
    expect(node.kind).toBe('constantNode');
});

test('it returns a frozen object', () => {
    const node = constantNode('myConstant', integerTypeNode('u32'), integerValueNode('42'));
    expect(Object.isFrozen(node)).toBe(true);
});

test('it creates a constant with an integer type and value', () => {
    const node = constantNode('maxItems', integerTypeNode('u64'), integerValueNode('100'));
    expect(node.identifier).toBe('maxItems');
    expect(node.type.kind).toBe('integerTypeNode');
    expect(node.value.kind).toBe('integerValueNode');
});

test('it creates a constant with a string type and value', () => {
    const node = constantNode('appName', stringTypeNode('utf8'), stringValueNode('MyApp'));
    expect(node.identifier).toBe('appName');
    expect(node.type.kind).toBe('stringTypeNode');
    expect(node.value.kind).toBe('stringValueNode');
});

test('it preserves the identifier casing', () => {
    const node = constantNode('my_constant', integerTypeNode('u8'), integerValueNode('1'));
    expect(node.identifier).toBe('my_constant');
});

test('it rejects invalid identifiers', () => {
    expect(() => constantNode('my-constant', integerTypeNode('u8'), integerValueNode('1'))).toThrow(
        new CodamaError(CODAMA_ERROR__INVALID_BRANDED_STRING, {
            actual: 'my-constant',
            expected: 'identifier (letters, digits and underscores; no leading digit)',
        }),
    );
});

test('it can have documentation', () => {
    const node = constantNode('myConstant', integerTypeNode('u32'), integerValueNode('42'), { docs: 'My docs' });
    expect(node.docs).toBe('My docs');
});

test('it omits documentation when not provided', () => {
    const node = constantNode('myConstant', integerTypeNode('u32'), integerValueNode('42'));
    expect('docs' in node).toBe(false);
});
