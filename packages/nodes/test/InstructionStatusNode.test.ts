import { expect, test } from 'vitest';

import { instructionStatusNode, textNode } from '../src';

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
    expect(node.lifecycle).toBe('deprecated');
    expect(node.message).toBe('Use newInstruction');
});

test('it can have a status with a text node message', () => {
    const message = textNode({ content: 'Use newInstruction' });
    const node = instructionStatusNode('deprecated', { message });
    expect(node.message).toBe(message);
});

test('it can have a status without message', () => {
    const node = instructionStatusNode('archived');
    expect(node.lifecycle).toBe('archived');
    expect(node.message).toBeUndefined();
});
