import { expect, test } from 'vitest';

import { stringTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = stringTypeNode('utf8');
    expect(node.kind).toBe('stringTypeNode');
});

test('it returns a frozen object', () => {
    const node = stringTypeNode('utf8');
    expect(Object.isFrozen(node)).toBe(true);
});
