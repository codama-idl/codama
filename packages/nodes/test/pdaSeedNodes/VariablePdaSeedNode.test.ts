import { expect, test } from 'vitest';

import { numberTypeNode, variablePdaSeedNode } from '../../src';

test('it returns the right node kind', () => {
    const node = variablePdaSeedNode('edition', numberTypeNode('u64'));
    expect(node.kind).toBe('variablePdaSeedNode');
});

test('it returns a frozen object', () => {
    const node = variablePdaSeedNode('edition', numberTypeNode('u64'));
    expect(Object.isFrozen(node)).toBe(true);
});
