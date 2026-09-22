import { CODAMA_ERROR__INVALID_BRANDED_STRING, CodamaError } from '@codama/errors';
import { expect, test } from 'vitest';

import { integerValueNode } from '../../src';

test('it returns the right node kind', () => {
    const node = integerValueNode('42');
    expect(node.kind).toBe('integerValueNode');
});

test('it returns a frozen object', () => {
    const node = integerValueNode('42');
    expect(Object.isFrozen(node)).toBe(true);
});

test('it stores the value as a string', () => {
    const node = integerValueNode('42');
    expect(node.value).toBe('42');
});

test('it accepts zero, negative and very large values', () => {
    expect(integerValueNode('0').value).toBe('0');
    expect(integerValueNode('-42').value).toBe('-42');
    expect(integerValueNode('340282366920938463463374607431768211455').value).toBe(
        '340282366920938463463374607431768211455',
    );
});

test.each(['', '007', '-0', '1.5', '1e3', '+1', 'abc', ' 42'])('it rejects the invalid value %j', value => {
    expect(() => integerValueNode(value)).toThrow(
        new CodamaError(CODAMA_ERROR__INVALID_BRANDED_STRING, {
            actual: value,
            expected: 'integer (base-10, no leading zeros)',
        }),
    );
});
