import { expect, test } from 'vitest';

import { instructionArgumentOverrideNode } from '../../src';

test('it returns the right node kind', () => {
    const node = instructionArgumentOverrideNode("foo");
    expect(node.kind).toBe('instructionArgumentOverrideNode');
});

test('it returns a frozen object', () => {
    const node = instructionArgumentOverrideNode("foo");
    expect(Object.isFrozen(node)).toBe(true);
});
