import type { KinobiVersion } from '@codama/node-types';
import { expect, expectTypeOf, test } from 'vitest';

import { programNode, rootNode } from '../src';

test('it returns the right node kind', () => {
    const root = rootNode(programNode({ name: 'foo', publicKey: '1111' }));
    expect(root.kind).toBe('rootNode');
});

test('it returns the right Kinobi standard', () => {
    const root = rootNode(programNode({ name: 'foo', publicKey: '1111' }));
    expect(root.standard).toBe('codama');
});

test('it returns the right Kinobi version', () => {
    const root = rootNode(programNode({ name: 'foo', publicKey: '1111' }));
    expect(root.version).toBe(__VERSION__);
    expectTypeOf(root.version).toMatchTypeOf<KinobiVersion>();
});

test('it returns a frozen object', () => {
    const root = rootNode(programNode({ name: 'foo', publicKey: '1111' }));
    expect(Object.isFrozen(root)).toBe(true);
});
