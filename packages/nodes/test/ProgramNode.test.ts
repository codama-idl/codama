import { expect, test } from 'vitest';

import { accountNode, programNode, structTypeNode } from '../src';

test('it returns the right node kind', () => {
    const node = programNode({ name: 'foo', publicKey: '1111' });
    expect(node.kind).toBe('programNode');
});

test('it returns a frozen object', () => {
    const node = programNode({ name: 'foo', publicKey: '1111' });
    expect(Object.isFrozen(node)).toBe(true);
});

test('it omits array attributes entirely when they are empty (skip-when-empty)', () => {
    // Arrays are omitted when empty on write. An absent array and an empty
    // array are semantically identical (see the "Array attributes are omitted
    // when empty" convention in the `@codama/spec` README).
    const node = programNode({ name: 'foo', publicKey: '1111' });
    expect('accounts' in node).toBe(false);
    expect('instructions' in node).toBe(false);
    expect('pdas' in node).toBe(false);
    expect('definedTypes' in node).toBe(false);
    expect('events' in node).toBe(false);
    expect('errors' in node).toBe(false);
    expect('constants' in node).toBe(false);
});

test('it omits an array attribute even when an explicit empty array is passed', () => {
    const node = programNode({ accounts: [], name: 'foo', publicKey: '1111' });
    expect('accounts' in node).toBe(false);
});

test('it keeps array attributes when they are non-empty', () => {
    const account = accountNode({ data: structTypeNode([]), name: 'myAccount' });
    const node = programNode({ accounts: [account], name: 'foo', publicKey: '1111' });
    expect(node.accounts).toEqual([account]);
});
