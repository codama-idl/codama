import { expect, test } from 'vitest';

import { identityValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = identityValueNode();
    expect(node.kind).toBe('identityValueNode');
});

test('it returns a frozen object', () => {
    const node = identityValueNode();
    expect(Object.isFrozen(node)).toBe(true);
});
