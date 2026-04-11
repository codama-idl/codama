import type { ProgramNode } from '@codama/node-types';
import { expect, test } from 'vitest';

import { getAllEvents, programNode } from '../src';

test('it returns the right node kind', () => {
    const node = programNode({ name: 'foo', publicKey: '1111' });
    expect(node.kind).toBe('programNode');
});

test('it returns a frozen object', () => {
    const node = programNode({ name: 'foo', publicKey: '1111' });
    expect(Object.isFrozen(node)).toBe(true);
});

test('getAllEvents handles ProgramNode with missing events field', () => {
    const node = programNode({ name: 'foo', publicKey: '1111' });
    const raw = { ...node, events: undefined } as unknown as ProgramNode;
    expect(() => getAllEvents(raw)).not.toThrow();
    expect(getAllEvents(raw)).toEqual([]);
});
