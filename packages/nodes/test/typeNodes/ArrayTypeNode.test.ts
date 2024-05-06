import { expect, test } from 'vitest';

import { arrayTypeNode, numberTypeNode, remainderCountNode } from '../../src';

test('it returns the right node kind', () => {
    const node = arrayTypeNode(numberTypeNode('u64'), remainderCountNode());
    expect(node.kind).toBe('arrayTypeNode');
});

test('it returns a frozen object', () => {
    const node = arrayTypeNode(numberTypeNode('u64'), remainderCountNode());
    expect(Object.isFrozen(node)).toBe(true);
});
