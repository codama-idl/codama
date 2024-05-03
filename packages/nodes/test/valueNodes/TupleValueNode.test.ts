import { expect, test } from 'vitest';

import { tupleValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = tupleValueNode([]);
    expect(node.kind).toBe('tupleValueNode');
});

test('it returns a frozen object', () => {
    const node = tupleValueNode([]);
    expect(Object.isFrozen(node)).toBe(true);
});
