import { expect, test } from 'vitest';

import { programNode } from '../src';

test('it returns the right node kind', () => {
    const node = programNode({ name: 'foo', publicKey: '1111' });
    expect(node.kind).toBe('programNode');
});

test('it returns a frozen object', () => {
    const node = programNode({ name: 'foo', publicKey: '1111' });
    expect(Object.isFrozen(node)).toBe(true);
});
