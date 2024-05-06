import { expect, test } from 'vitest';

import { pdaLinkNode } from '../../src';

test('it returns the right node kind', () => {
    const node = pdaLinkNode('associatedToken');
    expect(node.kind).toBe('pdaLinkNode');
});

test('it returns a frozen object', () => {
    const node = pdaLinkNode('associatedToken');
    expect(Object.isFrozen(node)).toBe(true);
});
