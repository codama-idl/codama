import { accountValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { CONSTANT_PDA_SEED_VALUE_SUPPORTED_NODE_KINDS } from '../../../src/visitors/pda-seed-value';
import { makeConstantVisitor } from './constant-pda-seed-value-test-utils';

describe('constant-pda-seed-value: visitAccountValue', () => {
    test('should throw UNEXPECTED_NODE_KIND — accounts are not resolvable in a constant context', async () => {
        const visitor = makeConstantVisitor();
        await expect(visitor.visitAccountValue(accountValueNode('anything'))).rejects.toThrow(
            `Expected node of kind [${CONSTANT_PDA_SEED_VALUE_SUPPORTED_NODE_KINDS.join(',')}], got [accountValueNode]`,
        );
    });
});
