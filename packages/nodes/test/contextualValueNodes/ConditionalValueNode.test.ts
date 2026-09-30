import { expect, test } from 'vitest';

import { accountValueNode, conditionalValueNode, dataValueNode, integerValueNode, payerValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = conditionalValueNode({ condition: accountValueNode('token'), ifTrue: dataValueNode('space') });
    expect(node.kind).toBe('conditionalValueNode');
});

test('it returns a frozen object', () => {
    const node = conditionalValueNode({ condition: accountValueNode('token'), ifTrue: dataValueNode('space') });
    expect(Object.isFrozen(node)).toBe(true);
});

test('it accepts a data value as condition with an explicit value to compare against', () => {
    const node = conditionalValueNode({
        condition: dataValueNode('amount'),
        ifFalse: payerValueNode(),
        value: integerValueNode('0'),
    });
    expect(node.condition).toEqual(dataValueNode('amount'));
    expect(node.value).toEqual(integerValueNode('0'));
    expect(node.ifFalse).toEqual(payerValueNode());
    expect('ifTrue' in node).toBe(false);
});
