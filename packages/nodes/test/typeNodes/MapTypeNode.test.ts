import { expect, test } from 'vitest';

import { mapTypeNode, numberTypeNode, remainderCountNode } from '../../src';

test('it returns the right node kind', () => {
    const node = mapTypeNode(numberTypeNode('u8'), numberTypeNode('u64'), remainderCountNode());
    expect(node.kind).toBe('mapTypeNode');
});

test('it returns a frozen object', () => {
    const node = mapTypeNode(numberTypeNode('u8'), numberTypeNode('u64'), remainderCountNode());
    expect(Object.isFrozen(node)).toBe(true);
});
