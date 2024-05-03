import { expect, test } from 'vitest';

import { tupleTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = tupleTypeNode([]);
    expect(node.kind).toBe('tupleTypeNode');
});

test('it returns a frozen object', () => {
    const node = tupleTypeNode([]);
    expect(Object.isFrozen(node)).toBe(true);
});
