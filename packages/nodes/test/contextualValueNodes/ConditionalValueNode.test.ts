import { expect, test } from 'vitest';

import { accountValueNode, argumentValueNode, conditionalValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = conditionalValueNode({ condition: accountValueNode('token'), ifTrue: argumentValueNode('space') });
    expect(node.kind).toBe('conditionalValueNode');
});

test('it returns a frozen object', () => {
    const node = conditionalValueNode({ condition: accountValueNode('token'), ifTrue: argumentValueNode('space') });
    expect(Object.isFrozen(node)).toBe(true);
});
