import { expect, test } from 'vitest';

import { integerTypeNode, variablePdaSeedNode } from '../../src';

test('it returns the right node kind', () => {
    const node = variablePdaSeedNode('edition', integerTypeNode('u64'));
    expect(node.kind).toBe('variablePdaSeedNode');
});

test('it returns a frozen object', () => {
    const node = variablePdaSeedNode('edition', integerTypeNode('u64'));
    expect(Object.isFrozen(node)).toBe(true);
});

test('it can have documentation', () => {
    const node = variablePdaSeedNode('edition', integerTypeNode('u64'), { docs: 'The edition number.' });
    expect(node.docs).toBe('The edition number.');
});
