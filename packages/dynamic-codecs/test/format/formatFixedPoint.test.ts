import {
    fixedPointTypeNode,
    injectedValueNode,
    integerTypeNode,
    stringValueNode,
    unitNumberDisplayNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { formatFixedPoint, getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it formats decimal fixed points as their exact value', () => {
    // 12345 with a scale of 2.
    const decoded = getNodeCodec([fixedPointTypeNode(integerTypeNode('u32'), 2)]).decode(hex('39300000'));
    expect(formatFixedPoint(decoded)).toBe('123.45');
});

test('it formats decimal fixed points without trailing zeros', () => {
    // 12300 with a scale of 2.
    const decoded = getNodeCodec([fixedPointTypeNode(integerTypeNode('u32'), 2)]).decode(hex('0c300000'));
    expect(formatFixedPoint(decoded)).toBe('123');
});

test('it formats signed fixed points', () => {
    // -12345 with a scale of 2.
    const decoded = getNodeCodec([fixedPointTypeNode(integerTypeNode('i32'), 2)]).decode(hex('c7cfffff'));
    expect(formatFixedPoint(decoded)).toBe('-123.45');
});

test('it formats binary fixed points as their exact value', () => {
    // 16384 with 15 fractional bits, i.e. 0.5 in Q1.15.
    const decoded = getNodeCodec([fixedPointTypeNode(integerTypeNode('i16'), 15, { base: 2 })]).decode(hex('0040'));
    expect(formatFixedPoint(decoded)).toBe('0.5');
});

test('it formats fixed points with the unit of their type', () => {
    const decoded = getNodeCodec([fixedPointTypeNode(integerTypeNode('u32'), 2, { unit: '%' })]).decode(
        hex('39300000'),
    );
    expect(formatFixedPoint(decoded)).toBe('123.45%');
});

test('it formats fixed points with the unit of their display over the one of their type', () => {
    const display = unitNumberDisplayNode({ unit: stringValueNode('SOL') });
    const decoded = getNodeCodec([fixedPointTypeNode(integerTypeNode('u32'), 2, { display, unit: 'tokens' })]).decode(
        hex('39300000'),
    );
    expect(formatFixedPoint(decoded)).toBe('123.45 SOL');
});

test('it formats 128-bit binary fixed points exactly', () => {
    // 2^128 - 1 with 64 fractional bits.
    const decoded = getNodeCodec([fixedPointTypeNode(integerTypeNode('u128'), 64, { base: 2 })]).decode(
        hex('ff'.repeat(16)),
    );
    expect(formatFixedPoint(decoded)).toBe(
        '18446744073709551615.9999999999999999999457898913757247782996273599565029144287109375',
    );
});

test('it formats fixed points with the resolved unit of their display', () => {
    const display = unitNumberDisplayNode({ unit: injectedValueNode({ key: 'symbol' }) });
    const decoded = getNodeCodec([fixedPointTypeNode(integerTypeNode('u32'), 2, { display, unit: 'tokens' })]).decode(
        hex('39300000'),
    );
    expect(formatFixedPoint(decoded, { resolveInjectedValue: () => 'SOL' })).toBe('123.45 SOL');
});

test('it formats fixed points with the unit of their type when their display unit cannot be resolved', () => {
    const display = unitNumberDisplayNode({ unit: injectedValueNode({ key: 'symbol' }) });
    const decoded = getNodeCodec([fixedPointTypeNode(integerTypeNode('u32'), 2, { display, unit: 'tokens' })]).decode(
        hex('39300000'),
    );
    expect(formatFixedPoint(decoded, { resolveInjectedValue: () => undefined })).toBe('123.45 tokens');
});

test('it formats fixed points for a locale', () => {
    // 123456789 with a scale of 2.
    const decoded = getNodeCodec([fixedPointTypeNode(integerTypeNode('u32'), 2)]).decode(hex('15cd5b07'));
    expect(formatFixedPoint(decoded, { numberFormat: new Intl.NumberFormat('en-US') })).toBe('1,234,567.89');
});
