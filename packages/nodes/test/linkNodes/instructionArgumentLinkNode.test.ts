import { expect, test } from 'vitest';

import { instructionArgumentLinkNode, instructionLinkNode } from '../../src';

test('it returns the right node kind', () => {
    const node = instructionArgumentLinkNode('foo', instructionLinkNode('createArgument'));
    expect(node.kind).toBe('instructionArgumentLinkNode');
});

test('it returns a frozen object', () => {
    const node = instructionArgumentLinkNode('foo', instructionLinkNode('createArgument'));
    expect(Object.isFrozen(node)).toBe(true);
});
