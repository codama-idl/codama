import { expect, test } from 'vitest';

import { fixedSizeTypeNode, stringTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = fixedSizeTypeNode(stringTypeNode('utf8'), 42);
    expect(node.kind).toBe('fixedSizeTypeNode');
});

test('it returns a frozen object', () => {
    const node = fixedSizeTypeNode(stringTypeNode('utf8'), 42);
    expect(Object.isFrozen(node)).toBe(true);
});
