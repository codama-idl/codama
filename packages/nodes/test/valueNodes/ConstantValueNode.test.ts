import { expect, test } from 'vitest';

import { constantValueNode, numberTypeNode, numberValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = constantValueNode(numberTypeNode('u8'), numberValueNode(42));
    expect(node.kind).toBe('constantValueNode');
});

test('it returns a frozen object', () => {
    const node = constantValueNode(numberTypeNode('u8'), numberValueNode(42));
    expect(Object.isFrozen(node)).toBe(true);
});
