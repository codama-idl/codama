import { expect, test } from 'vitest';

import { fieldDiscriminatorNode } from '../../src';

test('it returns the right node kind', () => {
    const node = fieldDiscriminatorNode('discriminator');
    expect(node.kind).toBe('fieldDiscriminatorNode');
});

test('it returns a frozen object', () => {
    const node = fieldDiscriminatorNode('discriminator');
    expect(Object.isFrozen(node)).toBe(true);
});
