import { expect, test } from 'vitest';

import { dateTimeTypeNode, numberTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = dateTimeTypeNode(numberTypeNode('u64'));
    expect(node.kind).toBe('dateTimeTypeNode');
});

test('it returns a frozen object', () => {
    const node = dateTimeTypeNode(numberTypeNode('u64'));
    expect(Object.isFrozen(node)).toBe(true);
});
