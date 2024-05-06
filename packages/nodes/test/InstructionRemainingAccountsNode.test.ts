import { expect, test } from 'vitest';

import { argumentValueNode, instructionRemainingAccountsNode } from '../src';

test('it returns the right node kind', () => {
    const node = instructionRemainingAccountsNode(argumentValueNode('foo'));
    expect(node.kind).toBe('instructionRemainingAccountsNode');
});

test('it returns a frozen object', () => {
    const node = instructionRemainingAccountsNode(argumentValueNode('foo'));
    expect(Object.isFrozen(node)).toBe(true);
});
