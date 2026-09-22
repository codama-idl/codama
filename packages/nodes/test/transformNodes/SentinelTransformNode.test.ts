import { expect, test } from 'vitest';

import { constantValueNodeFromBytes, sentinelTransformNode, stringTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = sentinelTransformNode(constantValueNodeFromBytes('base16', '00'));
    expect(node.kind).toBe('sentinelTransformNode');
});

test('it returns a frozen object', () => {
    const node = sentinelTransformNode(constantValueNodeFromBytes('base16', '00'));
    expect(Object.isFrozen(node)).toBe(true);
});

test('it keeps the provided sentinel', () => {
    const sentinel = constantValueNodeFromBytes('base16', '00');
    const node = sentinelTransformNode(sentinel);
    expect(node.sentinel).toBe(sentinel);
});

test('it can be attached to a type node', () => {
    const sentinel = constantValueNodeFromBytes('base16', '00');
    const node = stringTypeNode('utf8', { transforms: [sentinelTransformNode(sentinel)] });
    expect(node.transforms).toEqual([sentinelTransformNode(sentinel)]);
});
