import { expect, test } from 'vitest';

import { fixedPointTypeNode, integerTypeNode, stringValueNode, unitNumberDisplayNode } from '../../src';

test('it returns the right node kind', () => {
    const node = fixedPointTypeNode(integerTypeNode('u64'), 9);
    expect(node.kind).toBe('fixedPointTypeNode');
});

test('it returns a frozen object', () => {
    const node = fixedPointTypeNode(integerTypeNode('u64'), 9);
    expect(Object.isFrozen(node)).toBe(true);
});

test('it keeps the underlying integer and scale', () => {
    const node = fixedPointTypeNode(integerTypeNode('u64'), 9);
    expect(node.number).toEqual(integerTypeNode('u64'));
    expect(node.scale).toBe(9);
});

test('it omits base and unit when not provided', () => {
    const node = fixedPointTypeNode(integerTypeNode('u64'), 9);
    expect('base' in node).toBe(false);
    expect('unit' in node).toBe(false);
});

test('it keeps the provided base and unit', () => {
    const node = fixedPointTypeNode(integerTypeNode('u128'), 64, { base: 2, unit: 'SOL' });
    expect(node.base).toBe(2);
    expect(node.unit).toBe('SOL');
});

test('it can have a unit display node', () => {
    const display = unitNumberDisplayNode({ unit: stringValueNode('SOL') });
    const node = fixedPointTypeNode(integerTypeNode('u64'), 9, { display });
    expect(node.display).toBe(display);
});
