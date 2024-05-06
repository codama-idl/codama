import { expect, test } from 'vitest';

import { constantValueNodeFromBytes, sentinelTypeNode, stringTypeNode } from '../../src';

test('it returns the right node kind', () => {
    const node = sentinelTypeNode(stringTypeNode('utf8'), constantValueNodeFromBytes('base16', 'ff'));
    expect(node.kind).toBe('sentinelTypeNode');
});

test('it returns a frozen object', () => {
    const node = sentinelTypeNode(stringTypeNode('utf8'), constantValueNodeFromBytes('base16', 'ff'));
    expect(Object.isFrozen(node)).toBe(true);
});
