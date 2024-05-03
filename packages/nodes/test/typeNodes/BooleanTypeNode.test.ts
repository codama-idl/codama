import { expect, test } from 'vitest';

import { booleanTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = booleanTypeNode();
    expect(node.kind).toBe('booleanTypeNode');
});

test('it returns a frozen object', () => {
    const node = booleanTypeNode();
    expect(Object.isFrozen(node)).toBe(true);
});
