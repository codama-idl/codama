import { expect, test } from 'vitest';

import { enumValueNode, integerValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = enumValueNode('fruit', 'apple');
    expect(node.kind).toBe('enumValueNode');
});

test('it returns a frozen object', () => {
    const node = enumValueNode('fruit', 'apple');
    expect(Object.isFrozen(node)).toBe(true);
});

test('it accepts any value node as its payload', () => {
    const value = integerValueNode('42');
    const node = enumValueNode('operation', 'amount', { value });
    expect(node.value).toBe(value);
});
