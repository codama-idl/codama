import { expect, test } from 'vitest';

import { numberTypeNode, sizePrefixTypeNode, stringTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u32'));
    expect(node.kind).toBe('sizePrefixTypeNode');
});

test('it returns a frozen object', () => {
    const node = sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u32'));
    expect(Object.isFrozen(node)).toBe(true);
});
