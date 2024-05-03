import { expect, test } from 'vitest';

import { mapValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = mapValueNode([]);
    expect(node.kind).toBe('mapValueNode');
});

test('it returns a frozen object', () => {
    const node = mapValueNode([]);
    expect(Object.isFrozen(node)).toBe(true);
});
