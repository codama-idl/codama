import { expect, test } from 'vitest';

import { definedTypeLinkNode } from '../../src';

test('it returns the right node kind', () => {
    const node = definedTypeLinkNode('config');
    expect(node.kind).toBe('definedTypeLinkNode');
});

test('it returns a frozen object', () => {
    const node = definedTypeLinkNode('config');
    expect(Object.isFrozen(node)).toBe(true);
});
