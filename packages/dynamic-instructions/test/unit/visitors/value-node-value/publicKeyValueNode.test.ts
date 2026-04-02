import { address } from '@solana/addresses';
import { publicKeyValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../../../svm-test-context';
import { makeVisitor } from './value-node-value-test-utils';

describe('value-node-value: visitPublicKeyValue', () => {
    test('should resolve to Address', async () => {
        const key = await SvmTestContext.generateAddress();
        const result = makeVisitor().visitPublicKeyValue(publicKeyValueNode(key));
        expect(result).toEqual({ kind: 'publicKeyValueNode', value: address(key) });
    });
});
