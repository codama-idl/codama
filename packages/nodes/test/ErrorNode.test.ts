import { expect, test } from 'vitest';

import { errorNode } from '../src';

test('it returns the right node kind', () => {
    const node = errorNode({ name: 'foo', code: 42, message: 'error message' });
    expect(node.kind).toBe('errorNode');
});

test('it returns a frozen object', () => {
    const node = errorNode({ name: 'foo', code: 42, message: 'error message' });
    expect(Object.isFrozen(node)).toBe(true);
});
