import { noneValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeConstantVisitor } from './constant-pda-seed-value-test-utils';

describe('constant-pda-seed-value: visitNoneValue', () => {
    test('should return empty Uint8Array', async () => {
        const result = await makeConstantVisitor().visitNoneValue(noneValueNode());
        expect(result).toEqual(new Uint8Array(0));
    });
});
