import { expect, test } from 'vitest';

import { accountLinkNode } from '../../src';

test('it returns the right node kind', () => {
    const node = accountLinkNode('token');
    expect(node.kind).toBe('accountLinkNode');
});

test('it returns a frozen object', () => {
    const node = accountLinkNode('token');
    expect(Object.isFrozen(node)).toBe(true);
});
