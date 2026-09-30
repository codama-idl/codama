import { describe, expect, expectTypeOf, test } from 'vitest';

import { formatValueType, isObjectRecord, isValueEqual, safeStringify } from '../../src/shared/util';

describe('isObjectRecord', () => {
    test('should return true for plain objects', () => {
        expect(isObjectRecord({})).toBe(true);
        expect(isObjectRecord({ key: 'value' })).toBe(true);
    });

    test('should narrow type to Record<string, unknown>', () => {
        const value: unknown = { key: 'value' };
        if (isObjectRecord(value)) {
            expectTypeOf(value).toExtend<Record<string, unknown>>();
        }
    });

    test('should return false for null', () => {
        expect(isObjectRecord(null)).toBe(false);
    });

    test('should return false for arrays', () => {
        expect(isObjectRecord([1, 2, 3])).toBe(false);
    });

    test('should return false for primitives', () => {
        expect(isObjectRecord('string')).toBe(false);
        expect(isObjectRecord(42)).toBe(false);
        expect(isObjectRecord(true)).toBe(false);
        expect(isObjectRecord(undefined)).toBe(false);
    });

    test('should return false for class instances', () => {
        expect(isObjectRecord(new Date())).toBe(false);
        expect(isObjectRecord(new Map())).toBe(false);
    });

    test('should return false for Uint8Array', () => {
        expect(isObjectRecord(new Uint8Array([1, 2]))).toBe(false);
    });
});

describe('formatValueType', () => {
    test('should return "null" for null', () => {
        expect(formatValueType(null)).toBe('null');
    });

    test('should return array description with length', () => {
        expect(formatValueType([1, 2, 3])).toBe('array (length 3)');
        expect(formatValueType([])).toBe('array (length 0)');
    });

    test('should return Uint8Array description with length', () => {
        expect(formatValueType(new Uint8Array([1, 2]))).toBe('Uint8Array (length 2)');
        expect(formatValueType(new Uint8Array())).toBe('Uint8Array (length 0)');
    });

    test('should return "object" for plain objects', () => {
        expect(formatValueType({ key: 'value' })).toBe('object');
    });

    test('should return "object" for class instances', () => {
        expect(formatValueType(new Date())).toBe('object');
    });

    test('should return typeof for primitives', () => {
        expect(formatValueType('hello')).toBe('string');
        expect(formatValueType(42)).toBe('number');
        expect(formatValueType(true)).toBe('boolean');
        expect(formatValueType(undefined)).toBe('undefined');
        expect(formatValueType(42n)).toBe('bigint');
    });
});

describe('safeStringify', () => {
    test('should stringify plain objects', () => {
        expect(safeStringify({ a: 1 })).toBe('{"a":1}');
    });

    test('should stringify arrays', () => {
        expect(safeStringify([1, 2, 3])).toBe('[1,2,3]');
    });

    test('should stringify primitives', () => {
        expect(safeStringify('hello')).toBe('"hello"');
        expect(safeStringify(42)).toBe('42');
        expect(safeStringify(null)).toBe('null');
        expect(safeStringify(true)).toBe('true');
    });

    test('should convert BigInt to string', () => {
        expect(safeStringify(42n)).toBe('"42"');
        expect(safeStringify({ amount: 1000n })).toBe('{"amount":"1000"}');
    });

    test('should return non-serializable object for circular references', () => {
        const circular: Record<string, unknown> = {};
        circular.self = circular;
        expect(safeStringify(circular)).toBe('non-serializable object');
    });

    test('should always return a string', () => {
        expectTypeOf(safeStringify).returns.toBeString();
    });
});

describe('isValueEqual', () => {
    test('it compares integers regardless of their JavaScript type', () => {
        expect(isValueEqual(2, 2n)).toBe(true);
        expect(isValueEqual(2n, 2)).toBe(true);
        expect(isValueEqual(2, 3n)).toBe(false);
        expect(isValueEqual(1.5, 1.5)).toBe(true);
    });

    test('it compares enum variants by identifier', () => {
        expect(isValueEqual('slow', { __discriminator: 1, __kind: 'slow' })).toBe(true);
        expect(isValueEqual({ __kind: 'slow' }, { __discriminator: 1, __kind: 'slow' })).toBe(true);
        expect(isValueEqual('fast', { __discriminator: 1, __kind: 'slow' })).toBe(false);
        expect(isValueEqual('move', { __discriminator: 1, __kind: 'move', data: 1n })).toBe(false);
        expect(isValueEqual({ __kind: 'move', data: 1 }, { __discriminator: 1, __kind: 'move', data: 1n })).toBe(true);
    });

    test('it compares arrays and objects deeply', () => {
        expect(isValueEqual([1, { a: 2 }], [1n, { a: 2n }])).toBe(true);
        expect(isValueEqual([1], [1, 2])).toBe(false);
        expect(isValueEqual({ a: 1 }, { a: 1n, b: 2n })).toBe(false);
    });

    test('it compares bytes by content', () => {
        expect(isValueEqual(new Uint8Array([1, 2]), ['base16', '0102'])).toBe(true);
        expect(isValueEqual(['base64', 'AQI='], ['base16', '0102'])).toBe(true);
        expect(isValueEqual(new Uint8Array([1, 2]), ['base16', '0103'])).toBe(false);
    });

    test('it compares other values strictly', () => {
        expect(isValueEqual('a', 'a')).toBe(true);
        expect(isValueEqual(true, true)).toBe(true);
        expect(isValueEqual(null, undefined)).toBe(false);
    });
});
