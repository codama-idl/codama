import { expect, test } from 'vitest';

import { enumTupleVariantTypeNode, tupleTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = enumTupleVariantTypeNode('apple', tupleTypeNode([]));
    expect(node.kind).toBe('enumTupleVariantTypeNode');
});

test('it returns a frozen object', () => {
    const node = enumTupleVariantTypeNode('apple', tupleTypeNode([]));
    expect(Object.isFrozen(node)).toBe(true);
});
