import { expect, test } from 'vitest';

import { eventNode } from '../src';

test('it returns the right node kind', () => {
    const node = eventNode({ name: 'foo' });
    expect(node.kind).toBe('eventNode');
});

test('it returns a frozen object', () => {
    const node = eventNode({ name: 'foo' });
    expect(Object.isFrozen(node)).toBe(true);
});
