import { dateTimeTypeNode, integerTypeNode } from '@codama/nodes';
import { getI64Encoder } from '@solana/codecs';
import { expect, test } from 'vitest';

import { formatDateTime, getNodeCodec } from '../../src';

/** Decode a date-time from its raw number of ticks. */
function decodeDateTime(ticks: bigint, ticksPerSecond?: number) {
    const node = dateTimeTypeNode(integerTypeNode('i64'), ticksPerSecond === undefined ? {} : { ticksPerSecond });
    return getNodeCodec([node]).decode(getI64Encoder().encode(ticks));
}

test('it formats the Unix epoch', () => {
    expect(formatDateTime(decodeDateTime(0n))).toBe('1970-01-01T00:00:00Z');
});

test('it formats seconds since the Unix epoch', () => {
    expect(formatDateTime(decodeDateTime(1_704_067_200n))).toBe('2024-01-01T00:00:00Z');
});

test('it formats leap days', () => {
    expect(formatDateTime(decodeDateTime(1_709_208_000n))).toBe('2024-02-29T12:00:00Z');
});

test('it formats dates before the Unix epoch', () => {
    expect(formatDateTime(decodeDateTime(-1n))).toBe('1969-12-31T23:59:59Z');
});

test('it formats milliseconds as fractions of a second', () => {
    expect(formatDateTime(decodeDateTime(1_704_067_200_500n, 1000))).toBe('2024-01-01T00:00:00.5Z');
});

test('it formats nanoseconds exactly', () => {
    expect(formatDateTime(decodeDateTime(1_704_067_200_123_456_789n, 1_000_000_000))).toBe(
        '2024-01-01T00:00:00.123456789Z',
    );
});

test('it formats fractions before the Unix epoch', () => {
    expect(formatDateTime(decodeDateTime(-500n, 1000))).toBe('1969-12-31T23:59:59.5Z');
});

test('it rounds ticks that are not powers of 10 of a second to the nanosecond', () => {
    // 1 tick of 1/3 second.
    expect(formatDateTime(decodeDateTime(1n, 3))).toBe('1970-01-01T00:00:00.333333333Z');
});

test('it formats years beyond 9999 with an expanded year', () => {
    expect(formatDateTime(decodeDateTime(253_402_300_800n))).toBe('+010000-01-01T00:00:00Z');
});

test('it formats years before 0000 with an expanded year', () => {
    // One second before 0000-01-01T00:00:00Z.
    expect(formatDateTime(decodeDateTime(-62_167_219_201n))).toBe('-000001-12-31T23:59:59Z');
});

test('it formats dates beyond the range of JavaScript dates exactly', () => {
    // The largest i64 number of seconds.
    expect(formatDateTime(decodeDateTime(9_223_372_036_854_775_807n))).toBe('+292277026596-12-04T15:30:07Z');
});

test('it matches JavaScript dates within their range', () => {
    const seconds = [-8_640_000_000_000n, -62_135_596_800n, 0n, 951_782_400n, 8_640_000_000_000n];
    const expected = seconds.map(second => new Date(Number(second) * 1000).toISOString().replace('.000Z', 'Z'));
    expect(seconds.map(second => formatDateTime(decodeDateTime(second)))).toStrictEqual(expected);
});

test('it does not format date-times whose ticks per second are not positive integers', () => {
    expect(formatDateTime(decodeDateTime(1n, 0))).toBeNull();
});
