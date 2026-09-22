import { expect, test } from 'vitest';

import { integerTypeNode, postOffsetTransformNode } from '../../src';

test('it returns the right node kind', () => {
    const node = postOffsetTransformNode(4);
    expect(node.kind).toBe('postOffsetTransformNode');
});

test('it returns a frozen object', () => {
    const node = postOffsetTransformNode(4);
    expect(Object.isFrozen(node)).toBe(true);
});

test('it defaults the strategy to relative', () => {
    const node = postOffsetTransformNode(4);
    expect(node.offset).toBe(4);
    expect(node.strategy).toBe('relative');
});

test.each(['relative', 'absolute', 'padded', 'preOffset'] as const)('it keeps the %s strategy', strategy => {
    const node = postOffsetTransformNode(-2, { strategy });
    expect(node.offset).toBe(-2);
    expect(node.strategy).toBe(strategy);
});

test('it can be attached to a type node', () => {
    const node = integerTypeNode('u8', { transforms: [postOffsetTransformNode(4, { strategy: 'padded' })] });
    expect(node.transforms).toEqual([postOffsetTransformNode(4, { strategy: 'padded' })]);
});
