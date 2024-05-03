import { expect, test } from 'vitest';

import { resolverValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = resolverValueNode('foo');
    expect(node.kind).toBe('resolverValueNode');
});

test('it returns a frozen object', () => {
    const node = resolverValueNode('foo');
    expect(Object.isFrozen(node)).toBe(true);
});
