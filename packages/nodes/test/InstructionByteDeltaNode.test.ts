import { expect, test } from 'vitest';

import { accountLinkNode, dataValueNode, instructionByteDeltaNode, integerValueNode } from '../src';

test('it returns the right node kind', () => {
    const node = instructionByteDeltaNode(integerValueNode('42'));
    expect(node.kind).toBe('instructionByteDeltaNode');
});

test('it returns a frozen object', () => {
    const node = instructionByteDeltaNode(integerValueNode('42'));
    expect(Object.isFrozen(node)).toBe(true);
});

test('it defaults withHeader to true and omits subtract', () => {
    const node = instructionByteDeltaNode(integerValueNode('42'));
    expect(node.withHeader).toBe(true);
    expect('subtract' in node).toBe(false);
});

test('it accepts a data value or an account link as value', () => {
    expect(instructionByteDeltaNode(dataValueNode('space')).value).toEqual(dataValueNode('space'));
    expect(instructionByteDeltaNode(accountLinkNode('token'), { subtract: true, withHeader: false })).toEqual({
        kind: 'instructionByteDeltaNode',
        subtract: true,
        value: accountLinkNode('token'),
        withHeader: false,
    });
});
