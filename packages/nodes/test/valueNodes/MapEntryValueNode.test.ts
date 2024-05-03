import { expect, test } from 'vitest';

import { mapEntryValueNode, numberValueNode, stringValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = mapEntryValueNode(stringValueNode('age'), numberValueNode(42));
    expect(node.kind).toBe('mapEntryValueNode');
});

test('it returns a frozen object', () => {
    const node = mapEntryValueNode(stringValueNode('age'), numberValueNode(42));
    expect(Object.isFrozen(node)).toBe(true);
});
