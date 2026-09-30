import { expect, test } from 'vitest';

import {
    instructionAccountNode,
    instructionNode,
    instructionStatusNode,
    integerTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '../src';

test('it returns the right node kind', () => {
    const node = instructionNode({ identifier: 'foo' });
    expect(node.kind).toBe('instructionNode');
});

test('it returns a frozen object', () => {
    const node = instructionNode({ identifier: 'foo' });
    expect(Object.isFrozen(node)).toBe(true);
});

test('it defaults the optional account strategy to programId', () => {
    const node = instructionNode({ identifier: 'foo' });
    expect(node.optionalAccountStrategy).toBe('programId');
});

test('it defaults to no data', () => {
    const node = instructionNode({ identifier: 'foo' });
    expect(node.data).toBeUndefined();
});

test('it can have a data type', () => {
    const data = structTypeNode([structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') })]);
    const node = instructionNode({ data, identifier: 'foo' });
    expect(node.data).toBe(data);
});

test('it omits array attributes when they are empty', () => {
    const node = instructionNode({ accounts: [], byteDeltas: [], identifier: 'foo', remainingAccounts: [] });
    expect('accounts' in node).toBe(false);
    expect('byteDeltas' in node).toBe(false);
    expect('remainingAccounts' in node).toBe(false);
});

test('it keeps array attributes when they are non-empty', () => {
    const account = instructionAccountNode({ identifier: 'authority', isSigner: true, isWritable: false });
    const node = instructionNode({ accounts: [account], identifier: 'foo' });
    expect(node.accounts).toEqual([account]);
});

test('it defaults to no status', () => {
    const node = instructionNode({ identifier: 'foo' });
    expect(node.status).toBeUndefined();
});

test('it can have a live status', () => {
    const statusMode = instructionStatusNode('live');
    const node = instructionNode({ identifier: 'foo', status: statusMode });
    expect(node.status).toBe(statusMode);
    expect(node.status?.lifecycle).toBe('live');
});

test('it can have a deprecated status with message', () => {
    const statusMode = instructionStatusNode('deprecated', { message: 'Use the newFoo instruction instead.' });
    const node = instructionNode({ identifier: 'foo', status: statusMode });
    expect(node.status).toBe(statusMode);
    expect(node.status?.lifecycle).toBe('deprecated');
    expect(node.status?.message).toBe('Use the newFoo instruction instead.');
});

test('it can have an archived status with message', () => {
    const statusMode = instructionStatusNode('archived', { message: 'This instruction was removed in v2.0.0.' });
    const node = instructionNode({ identifier: 'foo', status: statusMode });
    expect(node.status).toBe(statusMode);
    expect(node.status?.lifecycle).toBe('archived');
    expect(node.status?.message).toBe('This instruction was removed in v2.0.0.');
});

test('it can have a draft status with message', () => {
    const statusMode = instructionStatusNode('draft', { message: 'This instruction is under development.' });
    const node = instructionNode({ identifier: 'foo', status: statusMode });
    expect(node.status).toBe(statusMode);
    expect(node.status?.lifecycle).toBe('draft');
    expect(node.status?.message).toBe('This instruction is under development.');
});

test('it can have a status without a message', () => {
    const statusMode = instructionStatusNode('deprecated');
    const node = instructionNode({ identifier: 'foo', status: statusMode });
    expect(node.status).toBe(statusMode);
    expect(node.status?.lifecycle).toBe('deprecated');
    expect(node.status?.message).toBeUndefined();
});

test('it can have an empty message', () => {
    const statusMode = instructionStatusNode('deprecated', { message: '' });
    const node = instructionNode({ identifier: 'foo', status: statusMode });
    expect(node.status).toBe(statusMode);
    expect(node.status?.lifecycle).toBe('deprecated');
    expect(node.status?.message).toBe('');
});
