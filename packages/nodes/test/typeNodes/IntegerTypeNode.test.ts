import { expect, test } from 'vitest';

import { fixedSizeTransformNode, integerTypeNode, stringValueNode, unitNumberDisplayNode } from '../../src';

test('it returns the right node kind', () => {
    const node = integerTypeNode('u8');
    expect(node.kind).toBe('integerTypeNode');
});

test('it returns a frozen object', () => {
    const node = integerTypeNode('u8');
    expect(Object.isFrozen(node)).toBe(true);
});

test('it defaults the endianness to little-endian', () => {
    const node = integerTypeNode('u64');
    expect(node.format).toBe('u64');
    expect(node.endian).toBe('le');
});

test('it keeps the provided endianness', () => {
    const node = integerTypeNode('i128', { endian: 'be' });
    expect(node.endian).toBe('be');
});

test('it omits unit, display and transforms when not provided', () => {
    const node = integerTypeNode('u8');
    expect('unit' in node).toBe(false);
    expect('display' in node).toBe(false);
    expect('transforms' in node).toBe(false);
});

test('it keeps the provided unit, display and transforms', () => {
    const display = unitNumberDisplayNode({ unit: stringValueNode('lamports') });
    const node = integerTypeNode('u64', { display, transforms: [fixedSizeTransformNode(16)], unit: 'lamports' });
    expect(node.unit).toBe('lamports');
    expect(node.display).toBe(display);
    expect(node.transforms).toEqual([fixedSizeTransformNode(16)]);
});
