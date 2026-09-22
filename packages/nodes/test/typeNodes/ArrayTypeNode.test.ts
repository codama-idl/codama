import { expect, test } from 'vitest';

import { arrayTypeNode, fixedSizeTransformNode, integerTypeNode, remainderCountNode } from '../../src';

test('it returns the right node kind', () => {
    const node = arrayTypeNode(integerTypeNode('u64'), remainderCountNode());
    expect(node.kind).toBe('arrayTypeNode');
});

test('it returns a frozen object', () => {
    const node = arrayTypeNode(integerTypeNode('u64'), remainderCountNode());
    expect(Object.isFrozen(node)).toBe(true);
});

test('it omits transforms when none are provided', () => {
    const node = arrayTypeNode(integerTypeNode('u64'), remainderCountNode());
    expect('transforms' in node).toBe(false);
});

test('it keeps the provided transforms', () => {
    const transforms = [fixedSizeTransformNode(32)];
    const node = arrayTypeNode(integerTypeNode('u64'), remainderCountNode(), { transforms });
    expect(node.transforms).toEqual(transforms);
});
