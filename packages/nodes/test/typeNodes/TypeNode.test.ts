import { expect, test } from 'vitest';

import {
    addTypeNodeTransforms,
    fixedSizeTransformNode,
    integerTypeNode,
    sizePrefixTransformNode,
    stringTypeNode,
} from '../../src';

test('it appends transforms to a type node with none', () => {
    const node = addTypeNodeTransforms(stringTypeNode('utf8'), [fixedSizeTransformNode(32)]);
    expect(node.transforms).toEqual([fixedSizeTransformNode(32)]);
});

test('it appends transforms after the existing ones', () => {
    const original = stringTypeNode('utf8', { transforms: [sizePrefixTransformNode(integerTypeNode('u32'))] });
    const node = addTypeNodeTransforms(original, [fixedSizeTransformNode(32)]);
    expect(node.transforms).toEqual([sizePrefixTransformNode(integerTypeNode('u32')), fixedSizeTransformNode(32)]);
});

test('it keeps the rest of the type node intact', () => {
    const node = addTypeNodeTransforms(stringTypeNode('base58'), [fixedSizeTransformNode(32)]);
    expect(node.kind).toBe('stringTypeNode');
    expect(node.encoding).toBe('base58');
});

test('it returns the same node when given no transforms', () => {
    const original = stringTypeNode('utf8');
    const node = addTypeNodeTransforms(original, []);
    expect(node).toBe(original);
    expect(node.transforms).toBeUndefined();
});

test('it does not mutate the original node', () => {
    const original = stringTypeNode('utf8', { transforms: [sizePrefixTransformNode(integerTypeNode('u32'))] });
    addTypeNodeTransforms(original, [fixedSizeTransformNode(32)]);
    expect(original.transforms).toEqual([sizePrefixTransformNode(integerTypeNode('u32'))]);
});

test('it returns a frozen object', () => {
    const node = addTypeNodeTransforms(stringTypeNode('utf8'), [fixedSizeTransformNode(32)]);
    expect(Object.isFrozen(node)).toBe(true);
});
