import { accountBumpValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeVisitor } from './account-default-value-test-utils';

describe('account-default-value: visitAccountBumpValue', () => {
    test('should throw "not yet supported"', async () => {
        const visitor = makeVisitor();
        await expect(visitor.visitAccountBumpValue(accountBumpValueNode('seed'))).rejects.toThrow(
            /AccountBumpValueNode not yet supported/,
        );
    });
});
