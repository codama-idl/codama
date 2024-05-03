import { expect, test } from 'vitest';

import { pdaNode } from '../src';

test('it returns the right node kind', () => {
    const node = pdaNode({ name: 'foo', seeds: [] });
    expect(node.kind).toBe('pdaNode');
});

test('it returns a frozen object', () => {
    const node = pdaNode({ name: 'foo', seeds: [] });
    expect(Object.isFrozen(node)).toBe(true);
});
