import { expect, test } from 'vitest';

import { enumTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = enumTypeNode([]);
    expect(node.kind).toBe('enumTypeNode');
});

test('it returns a frozen object', () => {
    const node = enumTypeNode([]);
    expect(Object.isFrozen(node)).toBe(true);
});
