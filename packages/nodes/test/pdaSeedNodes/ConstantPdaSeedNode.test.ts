import { expect, test } from 'vitest';

import {
    bytesTypeNode,
    bytesValueNode,
    constantPdaSeedNode,
    constantPdaSeedNodeFromBytes,
    constantPdaSeedNodeFromProgramId,
    constantPdaSeedNodeFromString,
    integerTypeNode,
    integerValueNode,
    programIdValueNode,
    publicKeyTypeNode,
    stringTypeNode,
    stringValueNode,
} from '../../src';

test('it returns the right node kind', () => {
    const node = constantPdaSeedNode(integerTypeNode('u64'), integerValueNode('42'));
    expect(node.kind).toBe('constantPdaSeedNode');
});

test('it returns a frozen object', () => {
    const node = constantPdaSeedNode(integerTypeNode('u64'), integerValueNode('42'));
    expect(Object.isFrozen(node)).toBe(true);
});

test('it can be created from a string', () => {
    const node = constantPdaSeedNodeFromString('utf8', 'metadata');
    expect(node).toEqual(constantPdaSeedNode(stringTypeNode('utf8'), stringValueNode('metadata')));
});

test('it can be created from bytes', () => {
    const node = constantPdaSeedNodeFromBytes('base16', 'aabbccdd');
    expect(node).toEqual(constantPdaSeedNode(bytesTypeNode(), bytesValueNode('base16', 'aabbccdd')));
});

test('it can be created from the program ID', () => {
    const node = constantPdaSeedNodeFromProgramId();
    expect(node).toEqual(constantPdaSeedNode(publicKeyTypeNode(), programIdValueNode()));
});
