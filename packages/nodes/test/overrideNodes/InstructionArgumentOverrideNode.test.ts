import { expect, test } from 'vitest';

import { instructionArgumentOverrideNode, instructionLinkNode } from '../../src';

test('it returns the right node kind', () => {
    const node = instructionArgumentOverrideNode("foo", instructionLinkNode("bar"));
    expect(node.kind).toBe('instructionArgumentOverrideNode');
});

test('it returns a frozen object', () => {
    const node = instructionArgumentOverrideNode("foo", instructionLinkNode("bar"));
    expect(Object.isFrozen(node)).toBe(true);
});
