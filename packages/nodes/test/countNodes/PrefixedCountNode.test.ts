import { expect, test } from 'vitest';

import { integerTypeNode, prefixedCountNode } from '../../src';

test('it returns the right node kind', () => {
    const node = prefixedCountNode(integerTypeNode('u32'));
    expect(node.kind).toBe('prefixedCountNode');
});

test('it returns a frozen object', () => {
    const node = prefixedCountNode(integerTypeNode('u32'));
    expect(Object.isFrozen(node)).toBe(true);
});
