import { expect, test } from 'vitest';

import { constantPdaSeedNodeFromString, pdaNode, publicKeyTypeNode, variablePdaSeedNode } from '../src';

test('it returns the right node kind', () => {
    const node = pdaNode({ identifier: 'foo', seeds: [] });
    expect(node.kind).toBe('pdaNode');
});

test('it returns a frozen object', () => {
    const node = pdaNode({ identifier: 'foo', seeds: [] });
    expect(Object.isFrozen(node)).toBe(true);
});

test('it omits seeds when the array is empty', () => {
    const node = pdaNode({ identifier: 'foo', seeds: [] });
    expect('seeds' in node).toBe(false);
});

test('it keeps seeds when they are non-empty', () => {
    const seeds = [constantPdaSeedNodeFromString('utf8', 'metadata'), variablePdaSeedNode('mint', publicKeyTypeNode())];
    const node = pdaNode({ identifier: 'foo', seeds });
    expect(node.seeds).toEqual(seeds);
});

test('it can override the program ID', () => {
    const node = pdaNode({ identifier: 'foo', programId: '1111', seeds: [] });
    expect(node.programId).toBe('1111');
});
