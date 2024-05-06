import { expect, test } from 'vitest';

import { stringValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = stringValueNode('hello world');
    expect(node.kind).toBe('stringValueNode');
});

test('it returns a frozen object', () => {
    const node = stringValueNode('hello world');
    expect(Object.isFrozen(node)).toBe(true);
});
