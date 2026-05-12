import { publicKeyValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { generateAddress } from '../../test-utils';
import { makeVisitor } from './account-default-value-test-utils';

describe('account-default-value: visitPublicKeyValue', () => {
    test('should return public key address', async () => {
        const addr = await generateAddress();
        const visitor = makeVisitor();
        const result = await visitor.visitPublicKeyValue(publicKeyValueNode(addr));
        expect(result).toBe(addr);
    });
});
