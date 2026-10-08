import { CODAMA_ERROR__INVALID_TICKS_PER_SECOND, CodamaError } from '@codama/errors';
import { durationTypeNode, integerTypeNode } from '@codama/nodes';
import { getI64Encoder } from '@solana/codecs';
import { expect, test } from 'vitest';

import { formatDuration, getNodeCodec } from '../../src';

/** Decode a duration from its raw number of ticks. */
function decodeDuration(ticks: bigint, ticksPerSecond?: number) {
    const node = durationTypeNode(integerTypeNode('i64'), ticksPerSecond === undefined ? {} : { ticksPerSecond });
    return getNodeCodec([node]).decode(getI64Encoder().encode(ticks));
}

test('it formats durations as hours, minutes and seconds', () => {
    expect(formatDuration(decodeDuration(5_400n))).toBe('01:30:00');
});

test('it formats durations of more than a day in hours', () => {
    expect(formatDuration(decodeDuration(176_400n))).toBe('49:00:00');
});

test('it formats negative durations', () => {
    expect(formatDuration(decodeDuration(-1n))).toBe('-00:00:01');
});

test('it formats milliseconds as fractions of a second', () => {
    expect(formatDuration(decodeDuration(90_500n, 1000))).toBe('00:01:30.5');
});

test('it formats negative fractions of a second', () => {
    expect(formatDuration(decodeDuration(-1_500n, 1000))).toBe('-00:00:01.5');
});

test('it rounds ticks that are not powers of 10 of a second to the nanosecond', () => {
    // 5 ticks of 1/3 second.
    expect(formatDuration(decodeDuration(5n, 3))).toBe('00:00:01.666666667');
});

test('it throws when the ticks per second of a duration are not a positive integer', () => {
    const node = durationTypeNode(integerTypeNode('i64'), { ticksPerSecond: -1 });
    const decoded = getNodeCodec([node]).decode(getI64Encoder().encode(1n));
    expect(() => formatDuration(decoded)).toThrow(
        new CodamaError(CODAMA_ERROR__INVALID_TICKS_PER_SECOND, { path: [node], ticksPerSecond: -1 }),
    );
});
