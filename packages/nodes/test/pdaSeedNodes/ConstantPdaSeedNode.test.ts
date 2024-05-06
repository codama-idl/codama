import { expect, test } from 'vitest';

import { constantPdaSeedNode, numberTypeNode, numberValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = constantPdaSeedNode(numberTypeNode('u64'), numberValueNode(42));
    expect(node.kind).toBe('constantPdaSeedNode');
});

test('it returns a frozen object', () => {
    const node = constantPdaSeedNode(numberTypeNode('u64'), numberValueNode(42));
    expect(Object.isFrozen(node)).toBe(true);
});
