import { expect, test } from 'vitest';

import { structTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = structTypeNode([]);
    expect(node.kind).toBe('structTypeNode');
});

test('it returns a frozen object', () => {
    const node = structTypeNode([]);
    expect(Object.isFrozen(node)).toBe(true);
});
