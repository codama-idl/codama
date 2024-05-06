import { expect, test } from 'vitest';

import { instructionByteDeltaNode, numberValueNode } from '../src';

test('it returns the right node kind', () => {
    const node = instructionByteDeltaNode(numberValueNode(42));
    expect(node.kind).toBe('instructionByteDeltaNode');
});

test('it returns a frozen object', () => {
    const node = instructionByteDeltaNode(numberValueNode(42));
    expect(Object.isFrozen(node)).toBe(true);
});
