import { expect, test } from 'vitest';

import { instructionNode, instructionStatus } from '../src';

test('it returns the right node kind', () => {
    const node = instructionNode({ name: 'foo' });
    expect(node.kind).toBe('instructionNode');
});

test('it returns a frozen object', () => {
    const node = instructionNode({ name: 'foo' });
    expect(Object.isFrozen(node)).toBe(true);
});

test('it defaults to no status', () => {
    const node = instructionNode({ name: 'foo' });
    expect(node.status).toBeUndefined();
});

test('it can have a live status', () => {
    const statusMode = instructionStatus('live');
    const node = instructionNode({ name: 'foo', status: statusMode });
    expect(node.status).toBe(statusMode);
    expect(node.status?.status).toBe('live');
});

test('it can have a deprecated status with message', () => {
    const statusMode = instructionStatus('deprecated', { message: 'Use the newFoo instruction instead.' });
    const node = instructionNode({ name: 'foo', status: statusMode });
    expect(node.status).toBe(statusMode);
    expect(node.status?.status).toBe('deprecated');
    expect(node.status?.message).toBe('Use the newFoo instruction instead.');
});

test('it can have an archived status with message', () => {
    const statusMode = instructionStatus('archived', { message: 'This instruction was removed in v2.0.0.' });
    const node = instructionNode({ name: 'foo', status: statusMode });
    expect(node.status).toBe(statusMode);
    expect(node.status?.status).toBe('archived');
    expect(node.status?.message).toBe('This instruction was removed in v2.0.0.');
});

test('it can have a draft status with message', () => {
    const statusMode = instructionStatus('draft', { message: 'This instruction is under development.' });
    const node = instructionNode({ name: 'foo', status: statusMode });
    expect(node.status).toBe(statusMode);
    expect(node.status?.status).toBe('draft');
    expect(node.status?.message).toBe('This instruction is under development.');
});

test('it can have a status without a message', () => {
    const statusMode = instructionStatus('deprecated');
    const node = instructionNode({ name: 'foo', status: statusMode });
    expect(node.status).toBe(statusMode);
    expect(node.status?.status).toBe('deprecated');
    expect(node.status?.message).toBeUndefined();
});

test('it can have an empty message', () => {
    const statusMode = instructionStatus('deprecated', { message: '' });
    const node = instructionNode({ name: 'foo', status: statusMode });
    expect(node.status).toBe(statusMode);
    expect(node.status?.status).toBe('deprecated');
    expect(node.status?.message).toBe('');
});
