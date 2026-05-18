import { publicKeyTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createCodecInputTransformer } from '../../../src/visitors/codec-input-transformer';
import { generateAddress } from '../../test-utils';
import { rootNodeMock } from './codec-input-transformer-test-utils';

describe('publicKeyTypeNode', () => {
    test('should pass through public key string', async () => {
        const transformer = createCodecInputTransformer(publicKeyTypeNode(), rootNodeMock);
        const pubkey = await generateAddress();
        expect(transformer(pubkey)).toBe(pubkey);
    });

    test('should pass through any value unchanged', () => {
        const transformer = createCodecInputTransformer(publicKeyTypeNode(), rootNodeMock);
        expect(transformer(null)).toBe(null);
        expect(transformer(123)).toBe(123);
    });
});
