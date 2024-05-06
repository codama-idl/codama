import { expect, test } from 'vitest';

import { structValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = structValueNode([]);
    expect(node.kind).toBe('structValueNode');
});

test('it returns a frozen object', () => {
    const node = structValueNode([]);
    expect(Object.isFrozen(node)).toBe(true);
});
