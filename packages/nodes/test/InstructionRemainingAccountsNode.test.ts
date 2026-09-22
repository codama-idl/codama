import { expect, test } from 'vitest';

import { instructionRemainingAccountsNode } from '../src';

test('it returns the right node kind', () => {
    const node = instructionRemainingAccountsNode('foo');
    expect(node.kind).toBe('instructionRemainingAccountsNode');
});

test('it returns a frozen object', () => {
    const node = instructionRemainingAccountsNode('foo');
    expect(Object.isFrozen(node)).toBe(true);
});

test('it omits the flags when they are not provided', () => {
    const node = instructionRemainingAccountsNode('foo');
    expect(node.identifier).toBe('foo');
    expect('isOptional' in node).toBe(false);
    expect('isSigner' in node).toBe(false);
    expect('isWritable' in node).toBe(false);
});

test('it keeps the provided flags', () => {
    const node = instructionRemainingAccountsNode('foo', { isOptional: true, isSigner: 'either', isWritable: true });
    expect(node.isOptional).toBe(true);
    expect(node.isSigner).toBe('either');
    expect(node.isWritable).toBe(true);
});
