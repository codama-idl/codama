import { expect, test } from 'vitest';

import { instructionBundleNode } from '../src';

test('it returns the right node kind', () => {
    const node = instructionBundleNode({ name: 'foo' });
    expect(node.kind).toBe('instructionBundleNode');
});

test('it returns a frozen object', () => {
    const node = instructionBundleNode({ name: 'foo' });
    expect(Object.isFrozen(node)).toBe(true);
});
