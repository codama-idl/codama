import { expect, test } from 'vitest';

import { injectedValueNode, stringValueNode, unitNumberDisplayNode } from '../../src';

test('it returns the right node kind', () => {
    const node = unitNumberDisplayNode({ unit: stringValueNode('SOL') });
    expect(node.kind).toBe('unitNumberDisplayNode');
});

test('it returns a frozen object', () => {
    const node = unitNumberDisplayNode({ unit: stringValueNode('SOL') });
    expect(Object.isFrozen(node)).toBe(true);
});

test('it keeps a concrete string unit', () => {
    const node = unitNumberDisplayNode({ unit: stringValueNode('SOL') });
    expect(node.unit).toEqual(stringValueNode('SOL'));
});

test('it keeps an injected unit', () => {
    const unit = injectedValueNode({ fallback: stringValueNode('tokens'), key: 'symbol' });
    const node = unitNumberDisplayNode({ unit });
    expect(node.unit).toBe(unit);
});
