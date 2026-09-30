import { CODAMA_ERROR__INVALID_BRANDED_STRING, CodamaError } from '@codama/errors';
import { expect, test } from 'vitest';

import { floatValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = floatValueNode('1.5');
    expect(node.kind).toBe('floatValueNode');
});

test('it returns a frozen object', () => {
    const node = floatValueNode('1.5');
    expect(Object.isFrozen(node)).toBe(true);
});

test('it stores the value as a string', () => {
    const node = floatValueNode('1.5');
    expect(node.value).toBe('1.5');
});

test('it accepts integers, negative decimals and the special values', () => {
    expect(floatValueNode('0').value).toBe('0');
    expect(floatValueNode('42').value).toBe('42');
    expect(floatValueNode('-0.25').value).toBe('-0.25');
    expect(floatValueNode('NaN').value).toBe('NaN');
    expect(floatValueNode('Infinity').value).toBe('Infinity');
    expect(floatValueNode('-Infinity').value).toBe('-Infinity');
});

test.each(['', '1.50', '.5', '1.', '01.5', '1e3', '+1.5', 'abc', 'nan'])(
    'it rejects the non-canonical value %j',
    value => {
        expect(() => floatValueNode(value)).toThrow(
            new CodamaError(CODAMA_ERROR__INVALID_BRANDED_STRING, {
                actual: value,
                expected: 'decimal (or "NaN"/"Infinity"/"-Infinity")',
            }),
        );
    },
);
