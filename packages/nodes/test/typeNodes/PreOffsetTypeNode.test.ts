import { expect, test } from 'vitest';

import { numberTypeNode, preOffsetTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = preOffsetTypeNode(numberTypeNode('u8'), 42);
    expect(node.kind).toBe('preOffsetTypeNode');
});

test('it returns a frozen object', () => {
    const node = preOffsetTypeNode(numberTypeNode('u8'), 42);
    expect(Object.isFrozen(node)).toBe(true);
});
