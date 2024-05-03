import { expect, test } from 'vitest';

import { definedTypeNode, structTypeNode } from '../src';

test('it returns the right node kind', () => {
    const node = definedTypeNode({ name: 'foo', type: structTypeNode([]) });
    expect(node.kind).toBe('definedTypeNode');
});

test('it returns a frozen object', () => {
    const node = definedTypeNode({ name: 'foo', type: structTypeNode([]) });
    expect(Object.isFrozen(node)).toBe(true);
});
