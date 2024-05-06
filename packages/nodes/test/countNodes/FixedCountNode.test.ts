import { expect, test } from 'vitest';

import { fixedCountNode } from '../../src';

test('it returns the right node kind', () => {
    const node = fixedCountNode(42);
    expect(node.kind).toBe('fixedCountNode');
});

test('it returns a frozen object', () => {
    const node = fixedCountNode(42);
    expect(Object.isFrozen(node)).toBe(true);
});
