import { expect, test } from 'vitest';

import { publicKeyTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = publicKeyTypeNode();
    expect(node.kind).toBe('publicKeyTypeNode');
});

test('it returns a frozen object', () => {
    const node = publicKeyTypeNode();
    expect(Object.isFrozen(node)).toBe(true);
});
