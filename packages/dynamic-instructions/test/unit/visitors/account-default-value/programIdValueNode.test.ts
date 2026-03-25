import { programIdValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeVisitor, programAddress } from './account-default-value-test-utils';

describe('account-default-value: visitProgramIdValue', () => {
    test('should return program public key from root', async () => {
        const visitor = makeVisitor();
        const result = await visitor.visitProgramIdValue(programIdValueNode());
        expect(result).toBe(programAddress);
    });
});
