import { expect, test } from 'vitest';

import { hiddenSuffixTypeNode, numberTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = hiddenSuffixTypeNode(numberTypeNode('u8'), []);
    expect(node.kind).toBe('hiddenSuffixTypeNode');
});

test('it returns a frozen object', () => {
    const node = hiddenSuffixTypeNode(numberTypeNode('u8'), []);
    expect(Object.isFrozen(node)).toBe(true);
});
