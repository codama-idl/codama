import type { CodamaVersion } from '@codama/node-types';
import { expect, expectTypeOf, test } from 'vitest';

import { CODAMA_VERSION, programNode, rootNode } from '../src';

test('it returns the right node kind', () => {
    const root = rootNode(programNode({ identifier: 'foo', publicKey: '1111' }));
    expect(root.kind).toBe('rootNode');
});

test('it returns the right Codama standard', () => {
    const root = rootNode(programNode({ identifier: 'foo', publicKey: '1111' }));
    expect(root.standard).toBe('codama');
});

test('it tags the root with the spec version it was generated against', () => {
    const root = rootNode(programNode({ identifier: 'foo', publicKey: '1111' }));
    expect(root.version).toBe(CODAMA_VERSION);
    expectTypeOf(root.version).toMatchTypeOf<CodamaVersion>();
});

test('it returns a frozen object', () => {
    const root = rootNode(programNode({ identifier: 'foo', publicKey: '1111' }));
    expect(Object.isFrozen(root)).toBe(true);
});

test('it omits additional programs when the array is empty', () => {
    const root = rootNode(programNode({ identifier: 'foo', publicKey: '1111' }), { additionalPrograms: [] });
    expect('additionalPrograms' in root).toBe(false);
});

test('it keeps additional programs when they are non-empty', () => {
    const additional = programNode({ identifier: 'bar', publicKey: '2222' });
    const root = rootNode(programNode({ identifier: 'foo', publicKey: '1111' }), { additionalPrograms: [additional] });
    expect(root.additionalPrograms).toEqual([additional]);
});
