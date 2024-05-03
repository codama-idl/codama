import { expect, test } from 'vitest';

import { accountNode } from '../src';

test('it returns the right node kind', () => {
    const node = accountNode({ name: 'foo' });
    expect(node.kind).toBe('accountNode');
});

test('it returns a frozen object', () => {
    const node = accountNode({ name: 'foo' });
    expect(Object.isFrozen(node)).toBe(true);
});
