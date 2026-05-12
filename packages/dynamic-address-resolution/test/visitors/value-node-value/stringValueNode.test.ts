import { stringValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeVisitor } from './value-node-value-test-utils';

describe('value-node-value: visitStringValue', () => {
    test('should resolve string', () => {
        const result = makeVisitor().visitStringValue(stringValueNode('hello'));
        expect(result).toEqual({ kind: 'stringValueNode', value: 'hello' });
    });

    test('should resolve empty string', () => {
        const result = makeVisitor().visitStringValue(stringValueNode(''));
        expect(result).toEqual({ kind: 'stringValueNode', value: '' });
    });
});
