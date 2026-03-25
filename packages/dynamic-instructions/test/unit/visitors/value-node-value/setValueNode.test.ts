import { accountValueNode, numberValueNode, setValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeVisitor } from './value-node-value-test-utils';

describe('value-node-value: visitSetValue', () => {
    test('should resolve empty set', () => {
        const result = makeVisitor().visitSetValue(setValueNode([]));
        expect(result).toEqual({ kind: 'setValueNode', value: [] });
    });

    test('should resolve set items', () => {
        const result = makeVisitor().visitSetValue(setValueNode([numberValueNode(10), numberValueNode(20)]));
        expect(result).toEqual({
            kind: 'setValueNode',
            value: [
                { kind: 'numberValueNode', value: 10 },
                { kind: 'numberValueNode', value: 20 },
            ],
        });
    });

    test('should throw for unsupported inner node', () => {
        expect(() =>
            makeVisitor().visitSetValue(
                // @ts-expect-error - accountValueNode is invalid as StandaloneValueNode
                setValueNode([accountValueNode('test')]),
            ),
        ).toThrow(/Cannot resolve set item/);
    });
});
