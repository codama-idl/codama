import { expect, test } from 'vitest';

import { sizeDiscriminatorNode } from '../../src';

test('it returns the right node kind', () => {
    const node = sizeDiscriminatorNode(42);
    expect(node.kind).toBe('sizeDiscriminatorNode');
});

test('it returns a frozen object', () => {
    const node = sizeDiscriminatorNode(42);
    expect(Object.isFrozen(node)).toBe(true);
});
