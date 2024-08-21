import { expect, test } from 'vitest';

import { instructionAccountLinkNode } from '../../src';

test('it returns the right node kind', () => {
    const node = instructionAccountLinkNode('mint');
    expect(node.kind).toBe('instructionAccountLinkNode');
});

test('it returns a frozen object', () => {
    const node = instructionAccountLinkNode('mint');
    expect(Object.isFrozen(node)).toBe(true);
});
