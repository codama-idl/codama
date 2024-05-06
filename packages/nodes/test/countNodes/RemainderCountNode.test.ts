import { expect, test } from 'vitest';

import { remainderCountNode } from '../../src';

test('it returns the right node kind', () => {
    const node = remainderCountNode();
    expect(node.kind).toBe('remainderCountNode');
});

test('it returns a frozen object', () => {
    const node = remainderCountNode();
    expect(Object.isFrozen(node)).toBe(true);
});
