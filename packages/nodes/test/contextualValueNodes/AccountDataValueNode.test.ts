import { CODAMA_ERROR__INVALID_BRANDED_STRING, CodamaError } from '@codama/errors';
import { expect, test } from 'vitest';

import { accountDataValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = accountDataValueNode('mint');
    expect(node.kind).toBe('accountDataValueNode');
});

test('it returns a frozen object', () => {
    const node = accountDataValueNode('mint');
    expect(Object.isFrozen(node)).toBe(true);
});

test('it omits the path when not provided', () => {
    const node = accountDataValueNode('mint');
    expect(node.account).toBe('mint');
    expect('path' in node).toBe(false);
});

test('it keeps the provided path', () => {
    const node = accountDataValueNode('mint', { path: 'decimals' });
    expect(node.account).toBe('mint');
    expect(node.path).toBe('decimals');
});

test('it accepts nested paths', () => {
    const node = accountDataValueNode('config', { path: 'fees[0].amount' });
    expect(node.path).toBe('fees[0].amount');
});

test('it rejects an invalid account identifier', () => {
    expect(() => accountDataValueNode('my-mint')).toThrow(
        new CodamaError(CODAMA_ERROR__INVALID_BRANDED_STRING, {
            actual: 'my-mint',
            expected: 'identifier (letters, digits and underscores; no leading digit)',
        }),
    );
});

test('it rejects an invalid path', () => {
    expect(() => accountDataValueNode('mint', { path: 'decimals.' })).toThrow(
        new CodamaError(CODAMA_ERROR__INVALID_BRANDED_STRING, {
            actual: 'decimals.',
            expected: 'path (e.g. "data.amount" or "[0].field")',
        }),
    );
});
