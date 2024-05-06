import { expect, test } from 'vitest';

import { enumValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = enumValueNode('fruit', 'apple');
    expect(node.kind).toBe('enumValueNode');
});

test('it returns a frozen object', () => {
    const node = enumValueNode('fruit', 'apple');
    expect(Object.isFrozen(node)).toBe(true);
});
