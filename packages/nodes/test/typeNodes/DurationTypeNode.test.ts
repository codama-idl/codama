import { expect, test } from 'vitest';

import { durationTypeNode, integerTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = durationTypeNode(integerTypeNode('u64'));
    expect(node.kind).toBe('durationTypeNode');
});

test('it returns a frozen object', () => {
    const node = durationTypeNode(integerTypeNode('u64'));
    expect(Object.isFrozen(node)).toBe(true);
});

test('it keeps the underlying integer', () => {
    const node = durationTypeNode(integerTypeNode('i64'));
    expect(node.number).toEqual(integerTypeNode('i64'));
});

test('it omits ticksPerSecond when not provided', () => {
    const node = durationTypeNode(integerTypeNode('u64'));
    expect('ticksPerSecond' in node).toBe(false);
});

test('it keeps the provided ticksPerSecond', () => {
    const node = durationTypeNode(integerTypeNode('u64'), { ticksPerSecond: 1000 });
    expect(node.ticksPerSecond).toBe(1000);
});
