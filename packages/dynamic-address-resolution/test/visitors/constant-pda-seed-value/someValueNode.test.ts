import { mapValueNode, numberValueNode, someValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { CONSTANT_PDA_SEED_VALUE_SUPPORTED_NODE_KINDS } from '../../../src/visitors/pda-seed-value';
import { makeConstantVisitor } from './constant-pda-seed-value-test-utils';

describe('constant-pda-seed-value: visitSomeValue', () => {
    test('should delegate to inner numberValueNode', async () => {
        const node = someValueNode(numberValueNode(42));
        const result = await makeConstantVisitor().visitSomeValue(node);
        expect(result).toEqual(new Uint8Array([42]));
    });

    test('should throw for unsupported inner node kind', async () => {
        const node = someValueNode(mapValueNode([]));
        await expect(makeConstantVisitor().visitSomeValue(node)).rejects.toThrow(
            `Expected node of kind [${CONSTANT_PDA_SEED_VALUE_SUPPORTED_NODE_KINDS.join(',')}], got [mapValueNode]`,
        );
    });
});
