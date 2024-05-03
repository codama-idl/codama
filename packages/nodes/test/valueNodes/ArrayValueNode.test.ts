import { expect, test } from 'vitest';

import { arrayValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = arrayValueNode([]);
    expect(node.kind).toBe('arrayValueNode');
});

test('it returns a frozen object', () => {
    const node = arrayValueNode([]);
    expect(Object.isFrozen(node)).toBe(true);
});
