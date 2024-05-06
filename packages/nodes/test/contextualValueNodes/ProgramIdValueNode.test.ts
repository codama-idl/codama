import { expect, test } from 'vitest';

import { programIdValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = programIdValueNode();
    expect(node.kind).toBe('programIdValueNode');
});

test('it returns a frozen object', () => {
    const node = programIdValueNode();
    expect(Object.isFrozen(node)).toBe(true);
});
