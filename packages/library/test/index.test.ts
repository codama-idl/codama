import { expect, test } from 'vitest';

import { identityVisitor, rootNode } from '../src';

test('it exports node helpers', () => {
    expect(typeof rootNode).toBe('function');
});

test('it exports visitors', () => {
    expect(typeof identityVisitor).toBe('function');
});
