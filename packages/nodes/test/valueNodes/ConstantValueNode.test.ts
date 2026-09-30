import { expect, test } from 'vitest';

import {
    bytesTypeNode,
    bytesValueNode,
    constantValueNode,
    constantValueNodeFromBytes,
    constantValueNodeFromString,
    integerTypeNode,
    integerValueNode,
    stringTypeNode,
    stringValueNode,
} from '../../src';

test('it returns the right node kind', () => {
    const node = constantValueNode(integerTypeNode('u8'), integerValueNode('42'));
    expect(node.kind).toBe('constantValueNode');
});

test('it returns a frozen object', () => {
    const node = constantValueNode(integerTypeNode('u8'), integerValueNode('42'));
    expect(Object.isFrozen(node)).toBe(true);
});

test('it can be created from a string', () => {
    const node = constantValueNodeFromString('utf8', 'hello');
    expect(node).toEqual(constantValueNode(stringTypeNode('utf8'), stringValueNode('hello')));
});

test('it can be created from bytes', () => {
    const node = constantValueNodeFromBytes('base16', 'aabbccdd');
    expect(node).toEqual(constantValueNode(bytesTypeNode(), bytesValueNode('base16', 'aabbccdd')));
});
