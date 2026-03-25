import { accountValueNode, numberValueNode, someValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeVisitor } from './value-node-value-test-utils';

describe('value-node-value: visitSomeValue', () => {
    test('should delegate to inner value node', () => {
        const result = makeVisitor().visitSomeValue(someValueNode(numberValueNode(42)));
        expect(result).toEqual({ kind: 'numberValueNode', value: 42 });
    });

    test('should throw for unsupported inner node', () => {
        expect(() =>
            makeVisitor().visitSomeValue(
                // @ts-expect-error - accountValueNode is invalid
                someValueNode(accountValueNode('test')),
            ),
        ).toThrow(/Cannot resolve someValueNode/);
    });
});
