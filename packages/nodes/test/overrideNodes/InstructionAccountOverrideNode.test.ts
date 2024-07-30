import { expect, test } from 'vitest';

import { instructionAccountOverrideNode, instructionLinkNode } from '../../src';

test('it returns the right node kind', () => {
    const node = instructionAccountOverrideNode("foo", instructionLinkNode("bar"));
    expect(node.kind).toBe('instructionAccountOverrideNode');
});

test('it returns a frozen object', () => {
    const node = instructionAccountOverrideNode("foo", instructionLinkNode("bar"));
    expect(Object.isFrozen(node)).toBe(true);
});
