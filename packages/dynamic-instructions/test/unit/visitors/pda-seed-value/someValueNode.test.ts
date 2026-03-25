import {
    constantValueNode,
    mapValueNode,
    numberValueNode,
    publicKeyTypeNode,
    publicKeyValueNode,
    someValueNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { makeVisitor } from './pda-seed-value-test-utils';

describe('pda-seed-value: visitSomeValue', () => {
    test('should delegate to inner numberValueNode', async () => {
        const node = someValueNode(numberValueNode(42));
        const result = await makeVisitor().visitSomeValue(node);
        expect(result).toEqual(new Uint8Array([42]));
    });

    test('should throw for unsupported inner node kind', async () => {
        const node = someValueNode(mapValueNode([]));
        await expect(makeVisitor().visitSomeValue(node)).rejects.toThrow(/Unsupported some PDA seed value/);
    });

    test('should throw for unsupported nested inner node kind', async () => {
        const node = someValueNode(constantValueNode(publicKeyTypeNode(), publicKeyValueNode('invalid-key')));
        await expect(makeVisitor().visitSomeValue(node)).rejects.toThrow(/Expected base58-encoded Address/);
    });
});
