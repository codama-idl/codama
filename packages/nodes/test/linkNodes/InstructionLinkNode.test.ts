import { expect, test } from 'vitest';

import { instructionLinkNode } from '../../src';

test('it returns the right node kind', () => {
    const node = instructionLinkNode('transferTokens');
    expect(node.kind).toBe('instructionLinkNode');
});

test('it returns a frozen object', () => {
    const node = instructionLinkNode('transferTokens');
    expect(Object.isFrozen(node)).toBe(true);
});
