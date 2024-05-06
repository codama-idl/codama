import { expect, test } from 'vitest';

import { pdaValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = pdaValueNode('associatedToken', []);
    expect(node.kind).toBe('pdaValueNode');
});

test('it returns a frozen object', () => {
    const node = pdaValueNode('associatedToken', []);
    expect(Object.isFrozen(node)).toBe(true);
});
