import { expect, test } from 'vitest';

import {
    constantValueNodeFromBytes,
    constantValueNodeFromString,
    hiddenPrefixTransformNode,
    stringTypeNode,
} from '../../src';

test('it returns the right node kind', () => {
    const node = hiddenPrefixTransformNode([constantValueNodeFromBytes('base16', 'ff')]);
    expect(node.kind).toBe('hiddenPrefixTransformNode');
});

test('it returns a frozen object', () => {
    const node = hiddenPrefixTransformNode([constantValueNodeFromBytes('base16', 'ff')]);
    expect(Object.isFrozen(node)).toBe(true);
});

test('it omits the prefix when the array is empty', () => {
    const node = hiddenPrefixTransformNode([]);
    expect('prefix' in node).toBe(false);
});

test('it keeps the provided prefix constants in order', () => {
    const prefix = [constantValueNodeFromBytes('base16', 'ff'), constantValueNodeFromString('utf8', 'hello')];
    const node = hiddenPrefixTransformNode(prefix);
    expect(node.prefix).toEqual(prefix);
});

test('it can be attached to a type node', () => {
    const prefix = [constantValueNodeFromBytes('base16', 'ff')];
    const node = stringTypeNode('utf8', { transforms: [hiddenPrefixTransformNode(prefix)] });
    expect(node.transforms).toEqual([hiddenPrefixTransformNode(prefix)]);
});
