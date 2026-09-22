import { expect, test } from 'vitest';

import { integerTypeNode, sizePrefixTransformNode, stringTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = sizePrefixTransformNode(integerTypeNode('u32'));
    expect(node.kind).toBe('sizePrefixTransformNode');
});

test('it returns a frozen object', () => {
    const node = sizePrefixTransformNode(integerTypeNode('u32'));
    expect(Object.isFrozen(node)).toBe(true);
});

test('it keeps the provided prefix', () => {
    const node = sizePrefixTransformNode(integerTypeNode('u32', { endian: 'be' }));
    expect(node.prefix).toEqual(integerTypeNode('u32', { endian: 'be' }));
});

test('it can be attached to a type node', () => {
    const node = stringTypeNode('utf8', { transforms: [sizePrefixTransformNode(integerTypeNode('u32'))] });
    expect(node.transforms).toEqual([sizePrefixTransformNode(integerTypeNode('u32'))]);
});
