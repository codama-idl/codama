import { expect, test } from 'vitest';

import { argumentValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = argumentValueNode('space');
    expect(node.kind).toBe('argumentValueNode');
});

test('it returns a frozen object', () => {
    const node = argumentValueNode('space');
    expect(Object.isFrozen(node)).toBe(true);
});
