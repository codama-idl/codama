import { expect, test } from 'vitest';

import { programLinkNode } from '../../src';

test('it returns the right node kind', () => {
    const node = programLinkNode('system');
    expect(node.kind).toBe('programLinkNode');
});

test('it returns a frozen object', () => {
    const node = programLinkNode('system');
    expect(Object.isFrozen(node)).toBe(true);
});
