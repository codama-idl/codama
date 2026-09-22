import { CODAMA_ERROR__INVALID_BRANDED_STRING, CodamaError } from '@codama/errors';
import { expect, test } from 'vitest';

import { dataValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = dataValueNode('amount');
    expect(node.kind).toBe('dataValueNode');
});

test('it returns a frozen object', () => {
    const node = dataValueNode('amount');
    expect(Object.isFrozen(node)).toBe(true);
});

test('it keeps the provided path', () => {
    expect(dataValueNode('amount').path).toBe('amount');
    expect(dataValueNode('config.amount').path).toBe('config.amount');
    expect(dataValueNode('[0].amount').path).toBe('[0].amount');
    expect(dataValueNode('items[2]').path).toBe('items[2]');
});

test.each(['', '1amount', 'config.', '.amount', 'items[a]', 'items[01]', 'config-amount'])(
    'it rejects the invalid path %j',
    path => {
        expect(() => dataValueNode(path)).toThrow(
            new CodamaError(CODAMA_ERROR__INVALID_BRANDED_STRING, {
                actual: path,
                expected: 'path (e.g. "data.amount" or "[0].field")',
            }),
        );
    },
);
