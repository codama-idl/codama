import { expect, test } from 'vitest';

import { instructionAccountLinkNode, instructionLinkNode } from '../../src';

test('it returns the right node kind', () => {
    const node = instructionAccountLinkNode('foo', instructionLinkNode('createAccount'));
    expect(node.kind).toBe('instructionAccountLinkNode');
});

test('it returns a frozen object', () => {
    const node = instructionAccountLinkNode('foo', instructionLinkNode('createAccount'));
    expect(Object.isFrozen(node)).toBe(true);
});
