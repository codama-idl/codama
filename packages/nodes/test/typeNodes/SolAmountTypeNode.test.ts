import { expect, test } from 'vitest';

import { numberTypeNode, solAmountTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = solAmountTypeNode(numberTypeNode('u32'));
    expect(node.kind).toBe('solAmountTypeNode');
});

test('it returns a frozen object', () => {
    const node = solAmountTypeNode(numberTypeNode('u32'));
    expect(Object.isFrozen(node)).toBe(true);
});
