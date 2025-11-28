import { expect, test } from 'vitest';

import { instructionStatusNode } from '../src';

test('it returns the right node kind', () => {
    const node = instructionStatusNode('live');
    expect(node.kind).toBe('instructionStatusNode');
});

test('it returns a frozen object', () => {
    const node = instructionStatusNode('live');
    expect(Object.isFrozen(node)).toBe(true);
});

test('it can have a status with message', () => {
    const node = instructionStatusNode('deprecated', { message: 'Use newInstruction' });
    expect(node.status).toBe('deprecated');
    expect(node.message).toBe('Use newInstruction');
});

test('it can have a status without message', () => {
    const node = instructionStatusNode('archived');
    expect(node.status).toBe('archived');
    expect(node.message).toBeUndefined();
});
