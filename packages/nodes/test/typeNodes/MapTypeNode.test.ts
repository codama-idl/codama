import { expect, test } from 'vitest';

import { integerTypeNode, mapTypeNode, remainderCountNode } from '../../src';

test('it returns the right node kind', () => {
    const node = mapTypeNode(integerTypeNode('u8'), integerTypeNode('u64'), remainderCountNode());
    expect(node.kind).toBe('mapTypeNode');
});

test('it returns a frozen object', () => {
    const node = mapTypeNode(integerTypeNode('u8'), integerTypeNode('u64'), remainderCountNode());
    expect(Object.isFrozen(node)).toBe(true);
});
