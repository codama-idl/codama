import { expect, test } from 'vitest';

import { enumStructVariantTypeNode, structTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = enumStructVariantTypeNode('apple', structTypeNode([]));
    expect(node.kind).toBe('enumStructVariantTypeNode');
});

test('it returns a frozen object', () => {
    const node = enumStructVariantTypeNode('apple', structTypeNode([]));
    expect(Object.isFrozen(node)).toBe(true);
});
