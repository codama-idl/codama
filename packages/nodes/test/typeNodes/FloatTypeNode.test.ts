import { expect, test } from 'vitest';

import { floatTypeNode, preOffsetTransformNode, stringValueNode, unitNumberDisplayNode } from '../../src';

test('it returns the right node kind', () => {
    const node = floatTypeNode('f32');
    expect(node.kind).toBe('floatTypeNode');
});

test('it returns a frozen object', () => {
    const node = floatTypeNode('f32');
    expect(Object.isFrozen(node)).toBe(true);
});

test('it defaults the endianness to little-endian', () => {
    const node = floatTypeNode('f64');
    expect(node.format).toBe('f64');
    expect(node.endian).toBe('le');
});

test('it keeps the provided endianness', () => {
    const node = floatTypeNode('f32', { endian: 'be' });
    expect(node.endian).toBe('be');
});

test('it omits unit, display and transforms when not provided', () => {
    const node = floatTypeNode('f32');
    expect('unit' in node).toBe(false);
    expect('display' in node).toBe(false);
    expect('transforms' in node).toBe(false);
});

test('it keeps the provided unit, display and transforms', () => {
    const display = unitNumberDisplayNode({ unit: stringValueNode('%') });
    const node = floatTypeNode('f64', { display, transforms: [preOffsetTransformNode(4)], unit: '%' });
    expect(node.unit).toBe('%');
    expect(node.display).toBe(display);
    expect(node.transforms).toEqual([preOffsetTransformNode(4)]);
});
