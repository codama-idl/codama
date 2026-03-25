import { accountValueNode, mapEntryValueNode, mapValueNode, numberValueNode, stringValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeVisitor } from './value-node-value-test-utils';

describe('value-node-value: visitMapValue', () => {
    test('should resolve empty map', () => {
        const result = makeVisitor().visitMapValue(mapValueNode([]));
        expect(result).toEqual({ kind: 'mapValueNode', value: [] });
    });

    test('should resolve key/value pairs recursively', () => {
        const result = makeVisitor().visitMapValue(
            mapValueNode([mapEntryValueNode(stringValueNode('key1'), numberValueNode(100))]),
        );
        expect(result).toEqual({
            kind: 'mapValueNode',
            value: [
                {
                    key: { kind: 'stringValueNode', value: 'key1' },
                    value: { kind: 'numberValueNode', value: 100 },
                },
            ],
        });
    });

    test('should throw for unsupported map key', () => {
        expect(() =>
            makeVisitor().visitMapValue(
                mapValueNode([
                    mapEntryValueNode(
                        // @ts-expect-error - accountValueNode is invalid StandaloneValueNode
                        accountValueNode('test'),
                        numberValueNode(1),
                    ),
                ]),
            ),
        ).toThrow(/Cannot resolve map key/);
    });

    test('should throw for unsupported map value', () => {
        expect(() =>
            makeVisitor().visitMapValue(
                mapValueNode([
                    mapEntryValueNode(
                        stringValueNode('ok'),
                        // @ts-expect-error - accountValueNode is invalid StandaloneValueNode
                        accountValueNode('test'),
                    ),
                ]),
            ),
        ).toThrow(/Cannot resolve map value/);
    });
});
