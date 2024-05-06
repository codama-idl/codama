import { expect, test } from 'vitest';

import { payerValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = payerValueNode();
    expect(node.kind).toBe('payerValueNode');
});

test('it returns a frozen object', () => {
    const node = payerValueNode();
    expect(Object.isFrozen(node)).toBe(true);
});
