import { expect, test } from 'vitest';

import { accountValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = accountValueNode('mint');
    expect(node.kind).toBe('accountValueNode');
});

test('it returns a frozen object', () => {
    const node = accountValueNode('mint');
    expect(Object.isFrozen(node)).toBe(true);
});
