import { expect, test } from 'vitest';

import { setValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = setValueNode([]);
    expect(node.kind).toBe('setValueNode');
});

test('it returns a frozen object', () => {
    const node = setValueNode([]);
    expect(Object.isFrozen(node)).toBe(true);
});
