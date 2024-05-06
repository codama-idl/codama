import { expect, test } from 'vitest';

import { numberTypeNode, postOffsetTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = postOffsetTypeNode(numberTypeNode('u8'), 42);
    expect(node.kind).toBe('postOffsetTypeNode');
});

test('it returns a frozen object', () => {
    const node = postOffsetTypeNode(numberTypeNode('u8'), 42);
    expect(Object.isFrozen(node)).toBe(true);
});
