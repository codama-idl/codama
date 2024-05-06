import { expect, test } from 'vitest';

import { bytesValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = bytesValueNode('utf8', 'hello world');
    expect(node.kind).toBe('bytesValueNode');
});

test('it returns a frozen object', () => {
    const node = bytesValueNode('utf8', 'hello world');
    expect(Object.isFrozen(node)).toBe(true);
});
