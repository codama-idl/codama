import { expect, test } from 'vitest';

import { hiddenPrefixTypeNode, numberTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = hiddenPrefixTypeNode(numberTypeNode('u8'), []);
    expect(node.kind).toBe('hiddenPrefixTypeNode');
});

test('it returns a frozen object', () => {
    const node = hiddenPrefixTypeNode(numberTypeNode('u8'), []);
    expect(Object.isFrozen(node)).toBe(true);
});
