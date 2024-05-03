import { expect, test } from 'vitest';

import { accountBumpValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = accountBumpValueNode('associatedToken');
    expect(node.kind).toBe('accountBumpValueNode');
});

test('it returns a frozen object', () => {
    const node = accountBumpValueNode('associatedToken');
    expect(Object.isFrozen(node)).toBe(true);
});
