import { publicKeyValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../../../svm-test-context';
import { makeVisitor } from './account-default-value-test-utils';

describe('account-default-value: visitPublicKeyValue', () => {
    test('should return public key address', async () => {
        const addr = await SvmTestContext.generateAddress();
        const visitor = makeVisitor();
        const result = await visitor.visitPublicKeyValue(publicKeyValueNode(addr));
        expect(result).toBe(addr);
    });
});
