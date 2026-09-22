import { expect, test } from 'vitest';

import { definedTypeNode, structTypeNode } from '../src';

test('it returns the right node kind', () => {
    const node = definedTypeNode({ identifier: 'foo', type: structTypeNode([]) });
    expect(node.kind).toBe('definedTypeNode');
});

test('it returns a frozen object', () => {
    const node = definedTypeNode({ identifier: 'foo', type: structTypeNode([]) });
    expect(Object.isFrozen(node)).toBe(true);
});

test('it can have documentation', () => {
    const node = definedTypeNode({ docs: 'line one\nline two', identifier: 'foo', type: structTypeNode([]) });
    expect(node.docs).toBe('line one\nline two');
});
