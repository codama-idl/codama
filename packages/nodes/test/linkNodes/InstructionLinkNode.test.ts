import { expect, test } from 'vitest';

import { instructionLinkNode } from '../../src';

test('it returns the right node kind', () => {
    const node = instructionLinkNode('createAccount', 'system');
    expect(node.kind).toBe('instructionLinkNode');
});

test('it returns a frozen object', () => {
    const node = instructionLinkNode('createAccount', 'system');
    expect(Object.isFrozen(node)).toBe(true);
});
