import { expect, test } from 'vitest';

import { integerTypeNode, optionTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = optionTypeNode(integerTypeNode('u8'));
    expect(node.kind).toBe('optionTypeNode');
});

test('it returns a frozen object', () => {
    const node = optionTypeNode(integerTypeNode('u8'));
    expect(Object.isFrozen(node)).toBe(true);
});

test('it defaults to a u8 prefix and a non-fixed layout', () => {
    const node = optionTypeNode(integerTypeNode('u8'));
    expect(node.prefix).toEqual(integerTypeNode('u8'));
    expect(node.fixed).toBe(false);
});

test('it keeps the provided prefix and fixed flag', () => {
    const node = optionTypeNode(integerTypeNode('u8'), { fixed: true, prefix: integerTypeNode('u32') });
    expect(node.prefix).toEqual(integerTypeNode('u32'));
    expect(node.fixed).toBe(true);
});
