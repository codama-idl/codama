import { expect, test } from 'vitest';

import { eventNode, structTypeNode } from '../src';

test('it returns the right node kind', () => {
    const node = eventNode({ data: structTypeNode([]), identifier: 'foo' });
    expect(node.kind).toBe('eventNode');
});

test('it returns a frozen object', () => {
    const node = eventNode({ data: structTypeNode([]), identifier: 'foo' });
    expect(Object.isFrozen(node)).toBe(true);
});

test('it omits discriminators when the array is empty', () => {
    const node = eventNode({ data: structTypeNode([]), discriminators: [], identifier: 'foo' });
    expect('discriminators' in node).toBe(false);
});
