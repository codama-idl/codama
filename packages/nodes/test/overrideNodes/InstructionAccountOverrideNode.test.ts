import { expect, test } from 'vitest';

import { instructionAccountOverrideNode } from '../../src';

test('it returns the right node kind', () => {
    const node = instructionAccountOverrideNode("foo", []);
    expect(node.kind).toBe('instructionAccountOverrideNode');
});

test('it returns a frozen object', () => {
    const node = instructionAccountOverrideNode("foo", []);
    expect(Object.isFrozen(node)).toBe(true);
});
