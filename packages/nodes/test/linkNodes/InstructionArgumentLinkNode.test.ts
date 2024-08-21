import { expect, test } from 'vitest';

import { instructionArgumentLinkNode } from '../../src';

test('it returns the right node kind', () => {
    const node = instructionArgumentLinkNode('amount');
    expect(node.kind).toBe('instructionArgumentLinkNode');
});

test('it returns a frozen object', () => {
    const node = instructionArgumentLinkNode('amount');
    expect(Object.isFrozen(node)).toBe(true);
});
