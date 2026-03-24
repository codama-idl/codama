import { structTypeNode } from '../src';
import { expect, test } from 'vitest';

import { eventNode } from '../src';

test('it returns the right node kind', () => {
    const node = eventNode({ data: structTypeNode([]), name: 'foo' });
    expect(node.kind).toBe('eventNode');
});

test('it returns a frozen object', () => {
    const node = eventNode({ data: structTypeNode([]), name: 'foo' });
    expect(Object.isFrozen(node)).toBe(true);
});
