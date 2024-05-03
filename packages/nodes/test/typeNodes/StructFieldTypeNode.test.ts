import { expect, test } from 'vitest';

import { numberTypeNode, structFieldTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = structFieldTypeNode({ name: 'age', type: numberTypeNode('u8') });
    expect(node.kind).toBe('structFieldTypeNode');
});

test('it returns a frozen object', () => {
    const node = structFieldTypeNode({ name: 'age', type: numberTypeNode('u8') });
    expect(Object.isFrozen(node)).toBe(true);
});
