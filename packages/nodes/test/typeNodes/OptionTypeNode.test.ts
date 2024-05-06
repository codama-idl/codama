import { expect, test } from 'vitest';

import { numberTypeNode, optionTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = optionTypeNode(numberTypeNode('u8'));
    expect(node.kind).toBe('optionTypeNode');
});

test('it returns a frozen object', () => {
    const node = optionTypeNode(numberTypeNode('u8'));
    expect(Object.isFrozen(node)).toBe(true);
});
