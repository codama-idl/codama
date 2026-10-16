import {
    accountValueNode,
    amountNumberDisplayNode,
    floatValueNode,
    injectedValueNode,
    instructionNode,
    integerTypeNode,
    integerValueNode,
    providedNode,
    publicKeyValueNode,
    stringValueNode,
    unitNumberDisplayNode,
    type ValueNode,
} from '@codama/nodes';
import { describe, expect, test } from 'vitest';

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
    const values = new Map<unknown, ValueNode>([
        [decimals, integerValueNode('6')],
        [unit, stringValueNode('USDC')],
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

test('it does not format amounts whose decimals are injected without a resolver or a provider', () => {
    const display = amountNumberDisplayNode({ decimals: injectedValueNode({ key: 'decimals' }) });
    const decoded = getNodeCodec([integerTypeNode('u64', { display })]).decode(hex('60e3160000000000'));
    expect(formatInteger(decoded)).toBeNull();
});

describe('provided values', () => {
    const decimals = injectedValueNode({ key: 'decimals' });
    const amount = integerTypeNode('u64', { display: amountNumberDisplayNode({ decimals }) });
    const decodeIn = (provides: Parameters<typeof instructionNode>[0]['provides']) =>
        getNodeCodec([instructionNode({ identifier: 'transfer', provides }), amount]).decode(hex('60e3160000000000'));

    test('it resolves injected values from the value nodes provided by the instructions on their path', () => {
        const decoded = decodeIn([providedNode('decimals', integerValueNode('6'))]);
        expect(formatInteger(decoded)).toBe('1.5');
    });

    test('it resolves injected values from their fallback when no instruction provides them', () => {
        const display = amountNumberDisplayNode({
            decimals: injectedValueNode({ fallback: integerValueNode('6'), key: 'decimals' }),
        });
        const node = integerTypeNode('u64', { display });
        expect(formatInteger(getNodeCodec([node]).decode(hex('60e3160000000000')))).toBe('1.5');
    });

    test('it leaves provided nodes that are not value nodes unresolved', () => {
        const decoded = decodeIn([providedNode('decimals', accountValueNode('mint'))]);
        expect(formatInteger(decoded)).toBeNull();
    });

    test('it prefers the resolver over the provided values', () => {
        const decoded = decodeIn([providedNode('decimals', integerValueNode('6'))]);
        expect(formatInteger(decoded, { resolveInjectedValue: () => integerValueNode('3') })).toBe('1500');
    });

    test('it falls back to the provided values when the resolver returns undefined', () => {
        const decoded = decodeIn([providedNode('decimals', integerValueNode('6'))]);
        expect(formatInteger(decoded, { resolveInjectedValue: () => undefined })).toBe('1.5');
    });
});

test.each<[string, ValueNode]>([
    ['negative integers', integerValueNode('-1')],
    ['integers beyond safe integers', integerValueNode('9007199254740992')],
    ['floats', floatValueNode('6')],
    ['strings', stringValueNode('6')],
])('it does not format amounts whose decimals resolve to %s', (_, value) => {
    const display = amountNumberDisplayNode({ decimals: injectedValueNode({ key: 'decimals' }) });
    const decoded = getNodeCodec([integerTypeNode('u64', { display })]).decode(hex('60e3160000000000'));
    expect(formatInteger(decoded, { resolveInjectedValue: () => value })).toBeNull();
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

test('it formats amounts with an address unit as the address', () => {
    const unit = publicKeyValueNode('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    const display = amountNumberDisplayNode({ decimals: integerValueNode('6'), unit });
    const decoded = getNodeCodec([integerTypeNode('u64', { display })]).decode(hex('60e3160000000000'));
    expect(formatInteger(decoded)).toBe('1.5 EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
});

test('it formats amounts with an address unit using the address formatter', () => {
    const unit = publicKeyValueNode('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    const display = amountNumberDisplayNode({ decimals: integerValueNode('6'), unit });
    const decoded = getNodeCodec([integerTypeNode('u64', { display })]).decode(hex('60e3160000000000'));
    expect(formatInteger(decoded, { formatAddress: () => 'USDC' })).toBe('1.5 USDC');
});

test('it formats integers with an address unit display using the address formatter', () => {
    const display = unitNumberDisplayNode({ unit: publicKeyValueNode('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') });
    const decoded = getNodeCodec([integerTypeNode('u8', { display })]).decode(hex('2a'));
    expect(formatInteger(decoded, { formatAddress: () => 'USDC' })).toBe('42 USDC');
});

test('it formats amounts with an injected address unit using the address formatter', () => {
    // Given an amount whose unit is provided by an account, e.g. its mint.
    const display = amountNumberDisplayNode({
        decimals: integerValueNode('6'),
        unit: injectedValueNode({ key: 'mint' }),
    });
    const decoded = getNodeCodec([integerTypeNode('u64', { display })]).decode(hex('60e3160000000000'));
    const resolveInjectedValue = () => publicKeyValueNode('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

    // Then the address goes through the address formatter, as literal ones do.
    expect(formatInteger(decoded, { formatAddress: () => 'USDC', resolveInjectedValue })).toBe('1.5 USDC');
    expect(formatInteger(decoded, { resolveInjectedValue })).toBe('1.5 EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
});

test('it does not use injected units of other kinds', () => {
    const display = unitNumberDisplayNode({ unit: injectedValueNode({ key: 'symbol' }) });
    const decoded = getNodeCodec([integerTypeNode('u8', { display, unit: 'tokens' })]).decode(hex('2a'));
    expect(formatInteger(decoded, { resolveInjectedValue: () => integerValueNode('6') })).toBe('42 tokens');
});

test('it does not use injected units resolving to empty strings', () => {
    const display = unitNumberDisplayNode({ unit: injectedValueNode({ key: 'symbol' }) });
    const decoded = getNodeCodec([integerTypeNode('u8', { display, unit: 'tokens' })]).decode(hex('2a'));
    expect(formatInteger(decoded, { resolveInjectedValue: () => stringValueNode('') })).toBe('42 tokens');
});
