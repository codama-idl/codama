import { expect, test } from 'vitest';

import { instructionNode } from '../src';

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
    expect(node.statusMessage).toBeUndefined();
});

test('it can have a live status', () => {
    const node = instructionNode({ name: 'foo', status: 'live' });
    expect(node.status).toBe('live');
});

test('it can have a deprecated status', () => {
    const node = instructionNode({
        name: 'foo',
        status: 'deprecated',
        statusMessage: 'Use the newFoo instruction instead.',
    });
    expect(node.status).toBe('deprecated');
    expect(node.statusMessage).toBe('Use the newFoo instruction instead.');
});

test('it can have an archived status', () => {
    const node = instructionNode({
        name: 'foo',
        status: 'archived',
        statusMessage: 'This instruction was removed in v2.0.0.',
    });
    expect(node.status).toBe('archived');
    expect(node.statusMessage).toBe('This instruction was removed in v2.0.0.');
});

test('it can have a draft status', () => {
    const node = instructionNode({
        name: 'foo',
        status: 'draft',
        statusMessage: 'This instruction is under development.',
    });
    expect(node.status).toBe('draft');
    expect(node.statusMessage).toBe('This instruction is under development.');
});

test('it can have an unaudited status', () => {
    const node = instructionNode({
        name: 'foo',
        status: 'unaudited',
        statusMessage: 'This instruction has not been audited yet.',
    });
    expect(node.status).toBe('unaudited');
    expect(node.statusMessage).toBe('This instruction has not been audited yet.');
});

test('it can have a status without a statusMessage', () => {
    const node = instructionNode({ name: 'foo', status: 'deprecated' });
    expect(node.status).toBe('deprecated');
    expect(node.statusMessage).toBeUndefined();
});

test('it can have a statusMessage without a status', () => {
    const node = instructionNode({ name: 'foo', statusMessage: 'Some context' });
    expect(node.status).toBeUndefined();
    expect(node.statusMessage).toBe('Some context');
});

test('it can have an empty statusMessage', () => {
    const node = instructionNode({ name: 'foo', status: 'deprecated', statusMessage: '' });
    expect(node.status).toBe('deprecated');
    expect(node.statusMessage).toBe('');
});
