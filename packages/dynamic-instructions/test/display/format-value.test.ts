import type { Address } from '@solana/addresses';
import {
    amountNumberDisplayNode,
    dateTimeNumberDisplayNode,
    durationNumberDisplayNode,
    injectedValueNode,
    numberValueNode,
    type ProvidedNode,
    providedNode,
    stringDisplayNode,
    stringValueNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import {
    formatAmountValue,
    formatDateTimeValue,
    formatDurationValue,
    formatStringValue,
} from '../../src/display/format-value';
import type { DisplayResolutionContext } from '../../src/display/types';

function context(overrides: Partial<DisplayResolutionContext> = {}): DisplayResolutionContext {
    return {
        accountAddresses: new Map<string, Address>(),
        provides: new Map<string, ProvidedNode>(),
        ...overrides,
    };
}

describe('formatAmountValue', () => {
    test('it scales an amount by literal decimals and appends a literal unit', async () => {
        // Given an amount display with literal decimals and unit.
        const node = amountNumberDisplayNode({ decimals: numberValueNode(9), unit: stringValueNode('SOL') });

        // When we format a raw integer amount.
        const result = await formatAmountValue(1_100_000_000n, node, context());

        // Then we expect the scaled value with the unit.
        expect(result).toBe('1.1 SOL');
    });

    test('it scales an amount without a unit when none is provided', async () => {
        // Given an amount display with decimals only.
        const node = amountNumberDisplayNode({ decimals: numberValueNode(6) });

        // When we format a raw integer amount.
        const result = await formatAmountValue(1_500_000n, node, context());

        // Then we expect the scaled value with no suffix.
        expect(result).toBe('1.5');
    });

    test('it trims trailing fractional zeros when scaling', async () => {
        // Given an amount display with decimals.
        const node = amountNumberDisplayNode({ decimals: numberValueNode(9) });

        // When we format an amount that scales to a whole number.
        const result = await formatAmountValue(2_000_000_000n, node, context());

        // Then we expect no fractional part.
        expect(result).toBe('2');
    });

    test('it resolves injected decimals from the provide/inject context', async () => {
        // Given an amount whose decimals are injected.
        const node = amountNumberDisplayNode({ decimals: injectedValueNode({ key: 'decimals' }) });
        const provides = new Map<string, ProvidedNode>([['decimals', providedNode('decimals', numberValueNode(6))]]);

        // When we format the amount.
        const result = await formatAmountValue(1_000_000n, node, context({ provides }));

        // Then we expect the value scaled by the injected decimals.
        expect(result).toBe('1');
    });

    test('it returns null when decimals cannot be resolved (correctness over enrichment)', async () => {
        // Given an amount whose injected decimals have no provider and no fallback.
        const node = amountNumberDisplayNode({ decimals: injectedValueNode({ key: 'decimals' }) });

        // When we format the amount.
        const result = await formatAmountValue(1_000_000n, node, context());

        // Then we expect null so the caller can fall back to the raw value.
        expect(result).toBeNull();
    });

    test('it omits the unit but still scales when only the unit is unresolvable', async () => {
        // Given resolvable decimals but an unresolvable unit.
        const node = amountNumberDisplayNode({
            decimals: numberValueNode(6),
            unit: injectedValueNode({ key: 'symbol' }),
        });

        // When we format the amount.
        const result = await formatAmountValue(2_500_000n, node, context());

        // Then we expect the scaled value with no unit.
        expect(result).toBe('2.5');
    });

    test('it treats an absent decimals node as no scaling', async () => {
        // Given an amount display with neither decimals nor unit.
        const node = amountNumberDisplayNode({});

        // When we format a raw integer amount.
        const result = await formatAmountValue(42n, node, context());

        // Then we expect the raw value as a string.
        expect(result).toBe('42');
    });
});

describe('formatDateTimeValue', () => {
    test('it formats a seconds timestamp as an ISO 8601 string', () => {
        // Given a date-time display in seconds.
        const node = dateTimeNumberDisplayNode({});

        // When we format a Unix timestamp in seconds.
        const result = formatDateTimeValue(1_761_365_183, node);

        // Then we expect the ISO 8601 representation.
        expect(result).toBe('2025-10-25T04:06:23.000Z');
    });

    test('it converts ticks to seconds using ticksPerSecond', () => {
        // Given a date-time display in milliseconds.
        const node = dateTimeNumberDisplayNode({ ticksPerSecond: 1000 });

        // When we format a millisecond timestamp.
        const result = formatDateTimeValue(1_761_365_183_000n, node);

        // Then we expect the same instant as the seconds case.
        expect(result).toBe('2025-10-25T04:06:23.000Z');
    });
});

describe('formatDurationValue', () => {
    test('it formats a duration as HH:mm:ss', () => {
        // Given a duration display in seconds.
        const node = durationNumberDisplayNode({});

        // When we format a one-hour duration.
        const result = formatDurationValue(3600, node);

        // Then we expect the padded HH:mm:ss form.
        expect(result).toBe('01:00:00');
    });

    test('it converts duration ticks to seconds using ticksPerSecond', () => {
        // Given a duration display in milliseconds.
        const node = durationNumberDisplayNode({ ticksPerSecond: 1000 });

        // When we format a duration of 90 seconds expressed in milliseconds.
        const result = formatDurationValue(90_000n, node);

        // Then we expect one minute and thirty seconds.
        expect(result).toBe('00:01:30');
    });
});

describe('formatStringValue', () => {
    test('it returns the whole string when no slice bounds are set', () => {
        // Given a string display with no bounds.
        const node = stringDisplayNode({});

        // When we format a string.
        const result = formatStringValue('SOLANA', node);

        // Then we expect the unchanged string.
        expect(result).toBe('SOLANA');
    });

    test('it slices a string by the given bounds', () => {
        // Given a string display with a slice range.
        const node = stringDisplayNode({ sliceEnd: 3, sliceStart: 0 });

        // When we format a string.
        const result = formatStringValue('SOLANA', node);

        // Then we expect the sliced substring.
        expect(result).toBe('SOL');
    });
});
