import { expect, test } from 'vitest';

import { integerTypeNode, preOffsetTransformNode } from '../../src';

test('it returns the right node kind', () => {
    const node = preOffsetTransformNode(4);
    expect(node.kind).toBe('preOffsetTransformNode');
});

test('it returns a frozen object', () => {
    const node = preOffsetTransformNode(4);
    expect(Object.isFrozen(node)).toBe(true);
});

test('it defaults the strategy to relative', () => {
    const node = preOffsetTransformNode(4);
    expect(node.offset).toBe(4);
    expect(node.strategy).toBe('relative');
});

test.each(['relative', 'absolute', 'padded'] as const)('it keeps the %s strategy', strategy => {
    const node = preOffsetTransformNode(-2, { strategy });
    expect(node.offset).toBe(-2);
    expect(node.strategy).toBe(strategy);
});

test('it can be attached to a type node', () => {
    const node = integerTypeNode('u8', { transforms: [preOffsetTransformNode(4, { strategy: 'absolute' })] });
    expect(node.transforms).toEqual([preOffsetTransformNode(4, { strategy: 'absolute' })]);
});
