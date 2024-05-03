import { expect, test } from 'vitest';

import { numberTypeNode, prefixedCountNode } from '../../src';

test('it returns the right node kind', () => {
    const node = prefixedCountNode(numberTypeNode('u32'));
    expect(node.kind).toBe('prefixedCountNode');
});

test('it returns a frozen object', () => {
    const node = prefixedCountNode(numberTypeNode('u32'));
    expect(Object.isFrozen(node)).toBe(true);
});
