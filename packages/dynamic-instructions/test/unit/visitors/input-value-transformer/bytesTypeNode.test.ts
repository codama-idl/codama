import { bytesTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createInputValueTransformer } from '../../../../src/instruction-encoding/visitors/input-value-transformer';
import { rootNodeMock } from './input-value-transformer-test-utils';

describe('bytesTypeNode', () => {
    test('should transform Uint8Array or number[] to tuple for bytesTypeNode', () => {
        const transformer = createInputValueTransformer(bytesTypeNode(), rootNodeMock, { bytesEncoding: 'base16' });

        // 'Hello' as bytes: [72, 101, 108, 108, 111] -> base16: '48656c6c6f'
        const inputNumbers = [72, 101, 108, 108, 111];
        const inputUint8 = new Uint8Array(inputNumbers);
        const resultWithUint8 = transformer(inputUint8);
        const resultWithNumbers = transformer(inputNumbers);
        const expectedResult = ['base16', '48656c6c6f'];

        expect(resultWithUint8).toEqual(expectedResult);
        expect(resultWithNumbers).toEqual(expectedResult);
    });

    test('should throw error for non-Uint8Array input', () => {
        const transformer = createInputValueTransformer(bytesTypeNode(), rootNodeMock, { bytesEncoding: 'base16' });
        const expectedMessage = /Expected \[Uint8Array \| number\[\]\] for \[bytesTypeNode\]/;
        expect(() => transformer(null)).toThrow(expectedMessage);
        expect(() => transformer(undefined)).toThrow(expectedMessage);
        expect(() => transformer('not a Uint8Array')).toThrow(expectedMessage);
        expect(() => transformer(123)).toThrow(expectedMessage);
        expect(() => transformer({ data: [1, 2, 3] })).toThrow(expectedMessage);
    });
});
