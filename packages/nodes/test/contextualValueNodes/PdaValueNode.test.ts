import { expect, test } from 'vitest';

import { accountValueNode, pdaLinkNode, pdaNode, pdaSeedValueNode, pdaValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = pdaValueNode('associatedToken');
    expect(node.kind).toBe('pdaValueNode');
});

test('it returns a frozen object', () => {
    const node = pdaValueNode('associatedToken');
    expect(Object.isFrozen(node)).toBe(true);
});

test('it wraps a string PDA into a PDA link node', () => {
    const node = pdaValueNode('associatedToken');
    expect(node.pda).toEqual(pdaLinkNode('associatedToken'));
});

test('it accepts an inline PDA node', () => {
    const pda = pdaNode({ identifier: 'associatedToken', seeds: [] });
    const node = pdaValueNode(pda);
    expect(node.pda).toBe(pda);
});

test('it omits seeds when the array is empty', () => {
    const node = pdaValueNode('associatedToken', { seeds: [] });
    expect('seeds' in node).toBe(false);
});

test('it keeps seeds and program ID when provided', () => {
    const seeds = [pdaSeedValueNode('mint', accountValueNode('mint'))];
    const node = pdaValueNode('associatedToken', { programId: accountValueNode('tokenProgram'), seeds });
    expect(node.seeds).toEqual(seeds);
    expect(node.programId).toEqual(accountValueNode('tokenProgram'));
});
