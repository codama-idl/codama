import { expect, test } from 'vitest';

import { numberValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = numberValueNode(42);
    expect(node.kind).toBe('numberValueNode');
});

test('it returns a frozen object', () => {
    const node = numberValueNode(42);
    expect(Object.isFrozen(node)).toBe(true);
});
