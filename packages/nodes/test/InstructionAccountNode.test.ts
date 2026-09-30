import { expect, test } from 'vitest';

import { accountLinkNode, instructionAccountNode, payerValueNode } from '../src';

test('it returns the right node kind', () => {
    const node = instructionAccountNode({ identifier: 'foo', isSigner: false, isWritable: false });
    expect(node.kind).toBe('instructionAccountNode');
});

test('it returns a frozen object', () => {
    const node = instructionAccountNode({ identifier: 'foo', isSigner: false, isWritable: false });
    expect(Object.isFrozen(node)).toBe(true);
});

test('it defaults isOptional to false', () => {
    const node = instructionAccountNode({ identifier: 'foo', isSigner: false, isWritable: false });
    expect(node.isOptional).toBe(false);
});

test('it can have a default value and an account link', () => {
    const node = instructionAccountNode({
        accountLink: accountLinkNode('token'),
        defaultValue: payerValueNode(),
        identifier: 'foo',
        isSigner: true,
        isWritable: true,
    });
    expect(node.defaultValue).toEqual(payerValueNode());
    expect(node.accountLink).toEqual(accountLinkNode('token'));
});
