import { expect, test } from 'vitest';

import { constantNode, numberTypeNode, numberValueNode, stringTypeNode, stringValueNode } from '../src';

test('it returns the right node kind', () => {
    const node = constantNode('myConstant', numberTypeNode('u32'), numberValueNode(42));
    expect(node.kind).toBe('constantNode');
});

test('it returns a frozen object', () => {
    const node = constantNode('myConstant', numberTypeNode('u32'), numberValueNode(42));
    expect(Object.isFrozen(node)).toBe(true);
});

test('it creates a constant with a number type and value', () => {
    const node = constantNode('maxItems', numberTypeNode('u64'), numberValueNode(100));
    expect(node.name).toBe('maxItems');
    expect(node.type.kind).toBe('numberTypeNode');
    expect(node.value.kind).toBe('numberValueNode');
});

test('it creates a constant with a string type and value', () => {
    const node = constantNode('appName', stringTypeNode('utf8'), stringValueNode('MyApp'));
    expect(node.name).toBe('appName');
    expect(node.type.kind).toBe('stringTypeNode');
    expect(node.value.kind).toBe('stringValueNode');
});

test('it converts name to camelCase', () => {
    const node = constantNode('my_constant', numberTypeNode('u8'), numberValueNode(1));
    expect(node.name).toBe('myConstant');
});

test('it can have documentation', () => {
    const node = constantNode('myConstant', numberTypeNode('u32'), numberValueNode(42), ['My docs']);
    expect(node.docs).toEqual(['My docs']);
});
