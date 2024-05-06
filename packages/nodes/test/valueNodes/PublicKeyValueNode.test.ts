import { expect, test } from 'vitest';

import { publicKeyValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = publicKeyValueNode('1111');
    expect(node.kind).toBe('publicKeyValueNode');
});

test('it returns a frozen object', () => {
    const node = publicKeyValueNode('1111');
    expect(Object.isFrozen(node)).toBe(true);
});
