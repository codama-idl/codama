import { publicKeyTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createInputValueTransformer } from '../../../../src/instruction-encoding/visitors/input-value-transformer';
import { SvmTestContext } from '../../../svm-test-context';
import { rootNodeMock } from './input-value-transformer-test-utils';

describe('publicKeyTypeNode', () => {
    test('should pass through public key string', () => {
        const transformer = createInputValueTransformer(publicKeyTypeNode(), rootNodeMock);
        const pubkey = SvmTestContext.generateAddress();
        expect(transformer(pubkey)).toBe(pubkey);
    });

    test('should pass through any value unchanged', () => {
        const transformer = createInputValueTransformer(publicKeyTypeNode(), rootNodeMock);
        expect(transformer(null)).toBe(null);
        expect(transformer(123)).toBe(123);
    });
});
