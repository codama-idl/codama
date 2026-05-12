import { noneValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeVisitor } from './value-node-value-test-utils';

describe('value-node-value: visitNoneValue', () => {
    test('should resolve none to null', () => {
        const result = makeVisitor().visitNoneValue(noneValueNode());
        expect(result).toEqual({ kind: 'noneValueNode', value: null });
    });
});
