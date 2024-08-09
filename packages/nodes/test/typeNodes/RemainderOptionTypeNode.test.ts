import { expect, test } from 'vitest';

import { numberTypeNode, remainderOptionTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = remainderOptionTypeNode(numberTypeNode('u8'));
    expect(node.kind).toBe('remainderOptionTypeNode');
});

test('it returns a frozen object', () => {
    const node = remainderOptionTypeNode(numberTypeNode('u8'));
    expect(Object.isFrozen(node)).toBe(true);
});
