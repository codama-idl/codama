import { expect, test } from 'vitest';

import { booleanValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = booleanValueNode(true);
    expect(node.kind).toBe('booleanValueNode');
});

test('it returns a frozen object', () => {
    const node = booleanValueNode(true);
    expect(Object.isFrozen(node)).toBe(true);
});
