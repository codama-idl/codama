import { expect, test } from 'vitest';

import { instructionArgumentNode, structTypeNode } from '../src';

test('it returns the right node kind', () => {
    const node = instructionArgumentNode({ name: 'foo', type: structTypeNode([]) });
    expect(node.kind).toBe('instructionArgumentNode');
});

test('it returns a frozen object', () => {
    const node = instructionArgumentNode({ name: 'foo', type: structTypeNode([]) });
    expect(Object.isFrozen(node)).toBe(true);
});
