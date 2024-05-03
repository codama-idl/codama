import { expect, test } from 'vitest';

import { noneValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = noneValueNode();
    expect(node.kind).toBe('noneValueNode');
});

test('it returns a frozen object', () => {
    const node = noneValueNode();
    expect(Object.isFrozen(node)).toBe(true);
});
