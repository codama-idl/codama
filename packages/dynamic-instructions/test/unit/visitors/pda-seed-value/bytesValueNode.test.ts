import { getBase16Codec, getBase58Codec, getUtf8Codec } from '@solana/codecs';
import { bytesValueNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../../../svm-test-context';
import { makeVisitor } from './pda-seed-value-test-utils';

describe('pda-seed-value: visitBytesValue', () => {
    test('should encode base16 data', async () => {
        // const hex = Buffer.from('Hello', 'utf8').toString('hex');
        const hex = '48656c6c6f';
        const result = await makeVisitor().visitBytesValue(bytesValueNode('base16', hex));
        expect(result).toEqual(getBase16Codec().encode(hex));
    });

    test('should encode base58 data', async () => {
        const b58 = await new SvmTestContext().createAccount();
        const result = await makeVisitor().visitBytesValue(bytesValueNode('base58', b58));
        expect(result).toEqual(getBase58Codec().encode(b58));
    });

    test('should encode utf8 data', async () => {
        const text = 'Hello';
        const result = await makeVisitor().visitBytesValue(bytesValueNode('utf8', text));
        expect(result).toEqual(getUtf8Codec().encode(text));
    });
});
