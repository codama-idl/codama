import { expect, test } from 'vitest';

import { enumEmptyVariantTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = enumEmptyVariantTypeNode('apple');
    expect(node.kind).toBe('enumEmptyVariantTypeNode');
});

test('it returns a frozen object', () => {
    const node = enumEmptyVariantTypeNode('apple');
    expect(Object.isFrozen(node)).toBe(true);
});
