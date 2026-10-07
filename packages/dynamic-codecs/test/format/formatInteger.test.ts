import {
    amountNumberDisplayNode,
    injectedValueNode,
    integerTypeNode,
    integerValueNode,
    stringValueNode,
    unitNumberDisplayNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { formatInteger, getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it formats integers as their digits', () => {
    const decoded = getNodeCodec([integerTypeNode('u64')]).decode(hex('2a00000000000000'));
    expect(formatInteger(decoded)).toBe('42');
});

test('it formats integers with the unit of their type', () => {
    const decoded = getNodeCodec([integerTypeNode('u64', { unit: 'slots' })]).decode(hex('2a00000000000000'));
    expect(formatInteger(decoded)).toBe('42 slots');
});

test('it writes some units straight after the value', () => {
    const decoded = getNodeCodec([integerTypeNode('u8', { unit: '%' })]).decode(hex('2a'));
    expect(formatInteger(decoded)).toBe('42%');
});

test('it formats integers with the unit of their display over the one of their type', () => {
    const display = unitNumberDisplayNode({ unit: stringValueNode('lamports') });
    const decoded = getNodeCodec([integerTypeNode('u64', { display, unit: 'units' })]).decode(hex('2a00000000000000'));
    expect(formatInteger(decoded)).toBe('42 lamports');
});

test('it formats amounts scaled by their decimals, with their unit', () => {
    const display = amountNumberDisplayNode({ decimals: integerValueNode('6'), unit: stringValueNode('USDC') });
    const decoded = getNodeCodec([integerTypeNode('u64', { display })]).decode(hex('60e3160000000000'));
    expect(formatInteger(decoded)).toBe('1.5 USDC');
});

test('it formats whole amounts without a fraction', () => {
    const display = amountNumberDisplayNode({ decimals: integerValueNode('6') });
    const decoded = getNodeCodec([integerTypeNode('u64', { display })]).decode(hex('40420f0000000000'));
    expect(formatInteger(decoded)).toBe('1');
});

test('it formats negative amounts', () => {
    const display = amountNumberDisplayNode({ decimals: integerValueNode('6') });
    const decoded = getNodeCodec([integerTypeNode('i64', { display })]).decode(hex('a01ce9ffffffffff'));
    expect(formatInteger(decoded)).toBe('-1.5');
});

test('it formats amounts of 128-bit integers exactly', () => {
    // 2^128 - 1 with 18 decimals.
    const display = amountNumberDisplayNode({ decimals: integerValueNode('18') });
    const decoded = getNodeCodec([integerTypeNode('u128', { display })]).decode(hex('ff'.repeat(16)));
    expect(formatInteger(decoded)).toBe('340282366920938463463.374607431768211455');
});

test('it formats amounts with injected decimals and units', () => {
    // Given an amount whose decimals and unit are injected.
    const decimals = injectedValueNode({ key: 'decimals' });
    const unit = injectedValueNode({ key: 'symbol' });
    const display = amountNumberDisplayNode({ decimals, unit });
    const decoded = getNodeCodec([integerTypeNode('u64', { display })]).decode(hex('60e3160000000000'));

    // When we format it with a resolver of both, then they are used.
    const values = new Map<unknown, unknown>([
        [decimals, 6n],
        [unit, 'USDC'],
    ]);
    expect(formatInteger(decoded, { resolveInjectedValue: path => values.get(path[path.length - 1]) })).toBe(
        '1.5 USDC',
    );
});

test('it resolves injected values from their path through the decoded node', () => {
    const decimals = injectedValueNode({ key: 'decimals' });
    const display = amountNumberDisplayNode({ decimals });
    const node = integerTypeNode('u64', { display });
    const decoded = getNodeCodec([node]).decode(hex('60e3160000000000'));
    const paths: unknown[] = [];
    formatInteger(decoded, {
        resolveInjectedValue: path => {
            paths.push(path);
            return undefined;
        },
    });
    expect(paths).toStrictEqual([[node, display, decimals]]);
});

test('it does not format amounts whose decimals cannot be resolved', () => {
    const display = amountNumberDisplayNode({ decimals: injectedValueNode({ key: 'decimals' }) });
    const decoded = getNodeCodec([integerTypeNode('u64', { display })]).decode(hex('60e3160000000000'));
    expect(formatInteger(decoded, { resolveInjectedValue: () => undefined })).toBeNull();
});

test('it does not format amounts whose decimals are injected without a resolver', () => {
    const display = amountNumberDisplayNode({ decimals: injectedValueNode({ key: 'decimals' }) });
    const decoded = getNodeCodec([integerTypeNode('u64', { display })]).decode(hex('60e3160000000000'));
    expect(formatInteger(decoded)).toBeNull();
});

test.each<[string, unknown]>([
    ['negative integers', -1n],
    ['fractions', 1.5],
    ['strings', '6'],
])('it does not format amounts whose decimals resolve to %s', (_, value) => {
    const display = amountNumberDisplayNode({ decimals: injectedValueNode({ key: 'decimals' }) });
    const decoded = getNodeCodec([integerTypeNode('u64', { display })]).decode(hex('60e3160000000000'));
    expect(formatInteger(decoded, { resolveInjectedValue: () => value })).toBeNull();
});

test('it accepts decimals resolving to numbers', () => {
    const display = amountNumberDisplayNode({ decimals: injectedValueNode({ key: 'decimals' }) });
    const decoded = getNodeCodec([integerTypeNode('u64', { display })]).decode(hex('60e3160000000000'));
    expect(formatInteger(decoded, { resolveInjectedValue: () => 6 })).toBe('1.5');
});

test('it formats amounts with the unit of their type when their own unit cannot be resolved', () => {
    const display = amountNumberDisplayNode({
        decimals: integerValueNode('6'),
        unit: injectedValueNode({ key: 'symbol' }),
    });
    const decoded = getNodeCodec([integerTypeNode('u64', { display, unit: 'tokens' })]).decode(hex('60e3160000000000'));
    expect(formatInteger(decoded, { resolveInjectedValue: () => undefined })).toBe('1.5 tokens');
});

test('it formats integers for a locale', () => {
    const decoded = getNodeCodec([integerTypeNode('u64')]).decode(hex('87d6120000000000'));
    expect(formatInteger(decoded, { numberFormat: new Intl.NumberFormat('en-US') })).toBe('1,234,567');
});

test('it formats amounts of shortU16 integers', () => {
    // 1500 with 3 decimals.
    const display = amountNumberDisplayNode({ decimals: integerValueNode('3') });
    const decoded = getNodeCodec([integerTypeNode('shortU16', { display })]).decode(hex('dc0b'));
    expect(formatInteger(decoded)).toBe('1.5');
});

test('it formats amounts with the fraction digits of a locale format', () => {
    // 1234567 with 6 decimals.
    const display = amountNumberDisplayNode({ decimals: integerValueNode('6') });
    const decoded = getNodeCodec([integerTypeNode('u64', { display })]).decode(hex('87d6120000000000'));
    const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
    expect(formatInteger(decoded, { numberFormat })).toBe('1.23');
});

test('it formats amounts for a locale', () => {
    // 1234567890 with 3 decimals.
    const display = amountNumberDisplayNode({ decimals: integerValueNode('3') });
    const decoded = getNodeCodec([integerTypeNode('u64', { display })]).decode(hex('d202964900000000'));
    expect(formatInteger(decoded, { numberFormat: new Intl.NumberFormat('en-US') })).toBe('1,234,567.89');
});

test('it places units with a custom function', () => {
    const display = amountNumberDisplayNode({ decimals: integerValueNode('6'), unit: stringValueNode('USDC') });
    const decoded = getNodeCodec([integerTypeNode('u64', { display })]).decode(hex('60e3160000000000'));
    expect(formatInteger(decoded, { formatUnit: (value, unit) => `${unit} ${value}` })).toBe('USDC 1.5');
});
