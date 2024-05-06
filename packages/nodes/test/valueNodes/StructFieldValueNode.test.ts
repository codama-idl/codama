import { expect, test } from 'vitest';

import { stringValueNode, structFieldValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = structFieldValueNode('name', stringValueNode('Alice'));
    expect(node.kind).toBe('structFieldValueNode');
});

test('it returns a frozen object', () => {
    const node = structFieldValueNode('name', stringValueNode('Alice'));
    expect(Object.isFrozen(node)).toBe(true);
});
