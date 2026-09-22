import { expect, test } from 'vitest';

import { constantValueNodeFromBytes, sentinelCountNode } from '../../src';

test('it returns the right node kind', () => {
    const node = sentinelCountNode(constantValueNodeFromBytes('base16', 'ff'));
    expect(node.kind).toBe('sentinelCountNode');
});

test('it returns a frozen object', () => {
    const node = sentinelCountNode(constantValueNodeFromBytes('base16', 'ff'));
    expect(Object.isFrozen(node)).toBe(true);
});

test('it keeps the sentinel and omits the strategy when not provided', () => {
    const sentinel = constantValueNodeFromBytes('base16', 'ff');
    const node = sentinelCountNode(sentinel);
    expect(node.sentinel).toBe(sentinel);
    expect('strategy' in node).toBe(false);
});

test.each(['required', 'optional', 'omitted'] as const)('it keeps the %s strategy', strategy => {
    const node = sentinelCountNode(constantValueNodeFromBytes('base16', 'ff'), { strategy });
    expect(node.strategy).toBe(strategy);
});
