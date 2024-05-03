import { expect, test } from 'vitest';

import { publicKeyTypeNode, zeroableOptionTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = zeroableOptionTypeNode(publicKeyTypeNode());
    expect(node.kind).toBe('zeroableOptionTypeNode');
});

test('it returns a frozen object', () => {
    const node = zeroableOptionTypeNode(publicKeyTypeNode());
    expect(Object.isFrozen(node)).toBe(true);
});
