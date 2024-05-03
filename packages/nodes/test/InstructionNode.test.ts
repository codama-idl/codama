import { expect, test } from 'vitest';

import { instructionNode } from '../src';

test('it returns the right node kind', () => {
    const node = instructionNode({ name: 'foo' });
    expect(node.kind).toBe('instructionNode');
});

test('it returns a frozen object', () => {
    const node = instructionNode({ name: 'foo' });
    expect(Object.isFrozen(node)).toBe(true);
});
