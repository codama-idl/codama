import type {
    AmountNumberDisplayNode,
    DateTimeNumberDisplayNode,
    DurationNumberDisplayNode,
    StringDisplayNode,
} from 'codama';

import { resolveInjectedValue } from './resolve-injected-value';
import type { DisplayResolutionContext } from './types';

/**
 * Formats an integer as a scaled amount with an optional unit (e.g. `1100000000` → `"1.1 SOL"`).
 *
 * The scale (`decimals`) is treated as correctness: when it cannot be resolved, this returns
 * `null` so callers fall back to the raw value rather than display a misscaled — and therefore
 * misleading — amount. The `unit` is treated as enrichment: when it cannot be resolved, the
 * scaled value is returned without a suffix.
 */
export async function formatAmountValue(
    value: bigint | number,
    node: AmountNumberDisplayNode,
    context: DisplayResolutionContext,
): Promise<string | null> {
    const decimals = node.decimals ? await resolveInjectedValue(node.decimals, context) : 0;
    if (decimals === null || (typeof decimals !== 'bigint' && typeof decimals !== 'number')) {
        return null;
    }

    const scaled = scaleByDecimals(value, Number(decimals));
    if (scaled === null) return null;

    const unit = node.unit ? await resolveInjectedValue(node.unit, context) : null;
    return typeof unit === 'string' && unit !== '' ? `${scaled} ${unit}` : scaled;
}

/**
 * Formats an integer counting ticks since the Unix epoch as an ISO 8601 date-time string.
 * `ticksPerSecond` (default `1`) converts the raw ticks back to seconds.
 */
export function formatDateTimeValue(value: bigint | number, node: DateTimeNumberDisplayNode): string | null {
    const seconds = toSeconds(value, node.ticksPerSecond);
    if (seconds === null) return null;
    const date = new Date(seconds * 1000);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
}

/**
 * Formats an integer counting ticks as an elapsed duration in `HH:mm:ss`.
 * `ticksPerSecond` (default `1`) converts the raw ticks back to seconds.
 */
export function formatDurationValue(value: bigint | number, node: DurationNumberDisplayNode): string | null {
    const totalSeconds = toSeconds(value, node.ticksPerSecond);
    if (totalSeconds === null || totalSeconds < 0) return null;

    const whole = Math.floor(totalSeconds);
    const hours = Math.floor(whole / 3600);
    const minutes = Math.floor((whole % 3600) / 60);
    const seconds = whole % 60;
    return [hours, minutes, seconds].map(part => part.toString().padStart(2, '0')).join(':');
}

/**
 * Presents a string by slicing it to the `[sliceStart, sliceEnd)` range of decoded characters.
 * Both bounds are optional and default to the start and end of the string respectively.
 */
export function formatStringValue(value: string, node: StringDisplayNode): string {
    if (node.sliceStart === undefined && node.sliceEnd === undefined) return value;
    return value.slice(node.sliceStart ?? 0, node.sliceEnd);
}

/**
 * Divides an integer value by `10 ^ decimals`, trimming trailing zeros from the fractional part.
 * Returns `null` for a non-integer value (which cannot be scaled as a fixed-point integer) or for
 * negative decimals (which cannot describe a fixed-point scale).
 */
function scaleByDecimals(value: bigint | number, decimals: number): string | null {
    if (typeof value === 'number' && !Number.isInteger(value)) return null;
    if (!Number.isInteger(decimals) || decimals < 0) return null;
    if (decimals === 0) return value.toString();

    const negative = value < 0;
    const digits = (negative ? -BigInt(value) : BigInt(value)).toString().padStart(decimals + 1, '0');
    const integerPart = digits.slice(0, digits.length - decimals);
    const fractionPart = digits.slice(digits.length - decimals).replace(/0+$/, '');
    const sign = negative ? '-' : '';
    return fractionPart ? `${sign}${integerPart}.${fractionPart}` : `${sign}${integerPart}`;
}

/** Converts a tick value into whole/fractional seconds using `ticksPerSecond` (default `1`). */
function toSeconds(value: bigint | number, ticksPerSecond: number | undefined): number | null {
    const ticks = Number(value);
    if (!Number.isFinite(ticks)) return null;
    const divisor = ticksPerSecond ?? 1;
    if (divisor <= 0) return null;
    return ticks / divisor;
}
