import { expect, test } from 'vitest';

import { bytesTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = bytesTypeNode();
    expect(node.kind).toBe('bytesTypeNode');
});

test('it returns a frozen object', () => {
    const node = bytesTypeNode();
    expect(Object.isFrozen(node)).toBe(true);
});
