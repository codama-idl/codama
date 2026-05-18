import { booleanValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeVisitor } from './value-node-value-test-utils';

describe('value-node-value: visitBooleanValue', () => {
    test('should resolve true', () => {
        const result = makeVisitor().visitBooleanValue(booleanValueNode(true));
        expect(result).toEqual({ kind: 'booleanValueNode', value: true });
    });

    test('should resolve false', () => {
        const result = makeVisitor().visitBooleanValue(booleanValueNode(false));
        expect(result).toEqual({ kind: 'booleanValueNode', value: false });
    });
});
