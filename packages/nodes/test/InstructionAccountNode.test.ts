import { expect, test } from 'vitest';

import { instructionAccountNode } from '../src';

test('it returns the right node kind', () => {
    const node = instructionAccountNode({ name: 'foo', isSigner: false, isWritable: false });
    expect(node.kind).toBe('instructionAccountNode');
});

test('it returns a frozen object', () => {
    const node = instructionAccountNode({ name: 'foo', isSigner: false, isWritable: false });
    expect(Object.isFrozen(node)).toBe(true);
});
