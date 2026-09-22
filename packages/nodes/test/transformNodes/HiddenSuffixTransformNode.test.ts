import { expect, test } from 'vitest';

import {
    constantValueNodeFromBytes,
    constantValueNodeFromString,
    hiddenSuffixTransformNode,
    stringTypeNode,
} from '../../src';

test('it returns the right node kind', () => {
    const node = hiddenSuffixTransformNode([constantValueNodeFromBytes('base16', 'ff')]);
    expect(node.kind).toBe('hiddenSuffixTransformNode');
});

test('it returns a frozen object', () => {
    const node = hiddenSuffixTransformNode([constantValueNodeFromBytes('base16', 'ff')]);
    expect(Object.isFrozen(node)).toBe(true);
});

test('it omits the suffix when the array is empty', () => {
    const node = hiddenSuffixTransformNode([]);
    expect('suffix' in node).toBe(false);
});

test('it keeps the provided suffix constants in order', () => {
    const suffix = [constantValueNodeFromBytes('base16', 'ff'), constantValueNodeFromString('utf8', 'hello')];
    const node = hiddenSuffixTransformNode(suffix);
    expect(node.suffix).toEqual(suffix);
});

test('it can be attached to a type node', () => {
    const suffix = [constantValueNodeFromBytes('base16', 'ff')];
    const node = stringTypeNode('utf8', { transforms: [hiddenSuffixTransformNode(suffix)] });
    expect(node.transforms).toEqual([hiddenSuffixTransformNode(suffix)]);
});
