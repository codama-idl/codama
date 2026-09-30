import { expect, test } from 'vitest';

import { dateTimeTypeNode, integerTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = dateTimeTypeNode(integerTypeNode('u64'));
    expect(node.kind).toBe('dateTimeTypeNode');
});

test('it returns a frozen object', () => {
    const node = dateTimeTypeNode(integerTypeNode('u64'));
    expect(Object.isFrozen(node)).toBe(true);
});

test('it omits ticksPerSecond when not provided', () => {
    const node = dateTimeTypeNode(integerTypeNode('u64'));
    expect('ticksPerSecond' in node).toBe(false);
});

test('it keeps the provided ticksPerSecond', () => {
    const node = dateTimeTypeNode(integerTypeNode('i64'), { ticksPerSecond: 1000 });
    expect(node.ticksPerSecond).toBe(1000);
});
