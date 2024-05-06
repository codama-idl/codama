import { expect, test } from 'vitest';

import { constantDiscriminatorNode, constantValueNodeFromBytes } from '../../src';

test('it returns the right node kind', () => {
    const node = constantDiscriminatorNode(constantValueNodeFromBytes('base16', 'aabbccdd'));
    expect(node.kind).toBe('constantDiscriminatorNode');
});

test('it returns a frozen object', () => {
    const node = constantDiscriminatorNode(constantValueNodeFromBytes('base16', 'aabbccdd'));
    expect(Object.isFrozen(node)).toBe(true);
});
