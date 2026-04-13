import { noneValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { makeVisitor } from './pda-seed-value-test-utils';

describe('pda-seed-value: visitNoneValue', () => {
    test('should return empty Uint8Array', async () => {
        const result = await makeVisitor().visitNoneValue(noneValueNode());
        expect(result).toEqual(new Uint8Array(0));
    });
});
