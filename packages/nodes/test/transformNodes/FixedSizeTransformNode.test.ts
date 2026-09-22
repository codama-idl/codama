import { expect, test } from 'vitest';

import { fixedSizeTransformNode, stringTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = fixedSizeTransformNode(32);
    expect(node.kind).toBe('fixedSizeTransformNode');
});

test('it returns a frozen object', () => {
    const node = fixedSizeTransformNode(32);
    expect(Object.isFrozen(node)).toBe(true);
});

test('it keeps the provided size', () => {
    const node = fixedSizeTransformNode(32);
    expect(node.size).toBe(32);
});

test('it can be attached to a type node', () => {
    const node = stringTypeNode('utf8', { transforms: [fixedSizeTransformNode(32)] });
    expect(node.transforms).toEqual([fixedSizeTransformNode(32)]);
});
