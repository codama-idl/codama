import { expect, test } from 'vitest';

import { accountValueNode, pdaSeedValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = pdaSeedValueNode('token', accountValueNode('token'));
    expect(node.kind).toBe('pdaSeedValueNode');
});

test('it returns a frozen object', () => {
    const node = pdaSeedValueNode('token', accountValueNode('token'));
    expect(Object.isFrozen(node)).toBe(true);
});
