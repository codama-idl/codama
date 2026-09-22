import { expect, test } from 'vitest';

import { integerTypeNode, remainderCountNode, setTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = setTypeNode(integerTypeNode('u64'), remainderCountNode());
    expect(node.kind).toBe('setTypeNode');
});

test('it returns a frozen object', () => {
    const node = setTypeNode(integerTypeNode('u64'), remainderCountNode());
    expect(Object.isFrozen(node)).toBe(true);
});
