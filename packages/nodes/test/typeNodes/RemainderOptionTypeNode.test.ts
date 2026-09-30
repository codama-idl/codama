import { expect, test } from 'vitest';

import { integerTypeNode, remainderOptionTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = remainderOptionTypeNode(integerTypeNode('u8'));
    expect(node.kind).toBe('remainderOptionTypeNode');
});

test('it returns a frozen object', () => {
    const node = remainderOptionTypeNode(integerTypeNode('u8'));
    expect(Object.isFrozen(node)).toBe(true);
});
