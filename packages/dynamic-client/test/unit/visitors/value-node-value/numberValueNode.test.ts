import { numberValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeVisitor } from './value-node-value-test-utils';

describe('value-node-value: visitNumberValue', () => {
    test('should resolve positive number', () => {
        const result = makeVisitor().visitNumberValue(numberValueNode(42));
        expect(result).toEqual({ kind: 'numberValueNode', value: 42 });
    });

    test('should resolve zero', () => {
        const result = makeVisitor().visitNumberValue(numberValueNode(0));
        expect(result).toEqual({ kind: 'numberValueNode', value: 0 });
    });

    test('should resolve negative number', () => {
        const result = makeVisitor().visitNumberValue(numberValueNode(-7));
        expect(result).toEqual({ kind: 'numberValueNode', value: -7 });
    });
});
