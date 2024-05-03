import { expect, test } from 'vitest';

import { numberTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = numberTypeNode('u8');
    expect(node.kind).toBe('numberTypeNode');
});

test('it returns a frozen object', () => {
    const node = numberTypeNode('u8');
    expect(Object.isFrozen(node)).toBe(true);
});
