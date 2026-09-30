import { expect, test } from 'vitest';

import { integerValueNode, someValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = someValueNode(integerValueNode('42'));
    expect(node.kind).toBe('someValueNode');
});

test('it returns a frozen object', () => {
    const node = someValueNode(integerValueNode('42'));
    expect(Object.isFrozen(node)).toBe(true);
});
