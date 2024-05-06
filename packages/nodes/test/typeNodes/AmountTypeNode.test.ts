import { expect, test } from 'vitest';

import { amountTypeNode, numberTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = amountTypeNode(numberTypeNode('u64'), 9);
    expect(node.kind).toBe('amountTypeNode');
});

test('it returns a frozen object', () => {
    const node = amountTypeNode(numberTypeNode('u64'), 9);
    expect(Object.isFrozen(node)).toBe(true);
});
