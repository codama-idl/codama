import { CODAMA_ERROR__INVALID_TICKS_PER_SECOND, CodamaError } from '@codama/errors';
import {
    AmountNumberDisplayNode,
    DateTimeTypeNode,
    DurationTypeNode,
    InjectableIntegerValueNode,
    InjectableStringValueNode,
    InjectedValueNode,
    IntegerFormat,
    isNode,
    Node,
    UnitNumberDisplayNode,
} from '@codama/nodes';
import { getLastNodeFromPath, NodePath } from '@codama/visitors-core';
import type { Address } from '@solana/addresses';
import {
    BinaryFixedPoint,
    binaryFixedPointToString,
    DecimalFixedPoint,
    decimalFixedPointToString,
    formatBinaryFixedPoint,
    formatDecimalFixedPoint,
    getBase16Decoder,
    rawBinaryFixedPoint,
    rawDecimalFixedPoint,
    Signedness,
} from '@solana/codecs';

import type {
    DecodedBooleanTypeNode,
    DecodedBytesTypeNode,
    DecodedDateTimeTypeNode,
    DecodedDurationTypeNode,
    DecodedEnumTypeNode,
    DecodedFixedPointTypeNode,
    DecodedFloatTypeNode,
    DecodedIntegerTypeNode,
    DecodedPublicKeyTypeNode,
    DecodedStringTypeNode,
} from './decoded';
import { getCodecFromBytesEncoding, getEnumVariantLabel } from './utils';

/**
 * Options shared by the formatters of decoded nodes. Every formatter accepts them, even those
 * that use none of them yet, so all formatters share the `(decoded, options)` signature.
 */
export type FormatOptions = {
    /**
     * Place a unit next to a formatted value, e.g. to write `"USD 40.5"`. Defaults to
     * {@link formatUnit}, which appends the unit after a space, or without one for `%`, `‰` and `°`.
     */
    formatUnit?: (value: string, unit: string) => string;
    /**
     * Format numbers for a locale, e.g. `new Intl.NumberFormat('en-US')`. Its options decide the
     * digits shown, e.g. 3 fraction digits at most by default. Amounts and fixed points are given
     * to it exactly, never through a JavaScript float. Defaults to plain digits with every
     * fraction digit, e.g. `"1234.56789"`.
     */
    numberFormat?: Intl.NumberFormat;
    /**
     * Format an address, e.g. to name it from sources the caller trusts, such as a token list or
     * an address book, or to truncate it: `address => names.get(address) ?? address`. Defaults to
     * the address itself.
     */
    formatAddress?: (address: Address) => string;
    /**
     * Resolve the value of an injected value node used by a display node, e.g. the `decimals` of
     * an amount provided by its instruction, given its path through the decoded node, e.g.
     * `[...decoded.path, amountNumberDisplayNode, injectedValueNode]`. The resolver handles
     * providers and fallbacks. Returning `undefined` leaves the value unresolved.
     */
    resolveInjectedValue?: (path: NodePath<InjectedValueNode>) => unknown;
};

/** The units written straight after their value, without a space. */
const UNITS_WITHOUT_SPACE: readonly string[] = ['%', '‰', '°'];

/**
 * Place a unit after a formatted value, separated by a space, except for units written
 * straight after their value: `%`, `‰` and `°`.
 *
 * @example
 * ```ts
 * formatUnit('1.5', 'SOL'); // "1.5 SOL"
 * formatUnit('12.5', '%'); // "12.5%"
 * ```
 */
export function formatUnit(value: string, unit: string): string {
    return UNITS_WITHOUT_SPACE.includes(unit) ? `${value}${unit}` : `${value} ${unit}`;
}

/**
 * Format a decoded integer using its display node, if any, and its unit.
 *
 * - With an `amountNumberDisplayNode`, the integer is divided by `10 ^ decimals`, e.g. `1500000`
 *   with 6 decimals gives `"1.5"`. When `decimals` cannot be resolved, `null` is returned rather
 *   than a wrongly scaled amount, so callers can present the raw value instead.
 * - The unit of its display node wins, and the unit of its type is the fallback whenever the
 *   former is absent or cannot be resolved.
 *
 * @example
 * ```ts
 * // u64 with amountNumberDisplayNode({ decimals: integerValueNode('6'), unit: stringValueNode('USDC') })
 * formatInteger(decoded); // "1.5 USDC"
 * ```
 */
export function formatInteger(decoded: DecodedIntegerTypeNode, options: FormatOptions = {}): string | null {
    const node = getLastNodeFromPath(decoded.path);
    const display = node.display;
    let text: string;
    if (isNode(display, 'amountNumberDisplayNode')) {
        const decimals = resolveIntegerInput(decoded.path, display, display.decimals, options);
        if (decimals === undefined) return null;
        const { signedness, totalBits } = getIntegerLayout(node.format);
        text = formatDecimal(rawDecimalFixedPoint(signedness, totalBits, decimals)(decoded.value), options);
    } else {
        text = options.numberFormat ? options.numberFormat.format(decoded.value) : decoded.value.toString();
    }
    return withUnit(text, getDisplayUnit(decoded.path, display, options) ?? node.unit, options);
}

/**
 * Format a decoded float with its unit, the unit of its display node winning over the unit of
 * its type.
 *
 * @example
 * ```ts
 * // f64 with unit 'USD'
 * formatFloat(decoded); // "1.5 USD"
 * ```
 */
export function formatFloat(decoded: DecodedFloatTypeNode, options: FormatOptions = {}): string {
    const node = getLastNodeFromPath(decoded.path);
    const text = options.numberFormat ? options.numberFormat.format(decoded.value) : decoded.value.toString();
    return withUnit(text, getDisplayUnit(decoded.path, node.display, options) ?? node.unit, options);
}

/**
 * Format a decoded fixed point as its exact value, `raw / base ^ scale`, with its unit, the
 * unit of its display node winning over the unit of its type. Binary fixed points (base 2)
 * have finite decimal expansions, so they are exact too.
 *
 * @example
 * ```ts
 * // fixedPointTypeNode(u32, 2, { unit: '%' })
 * formatFixedPoint(decoded); // "123.45%"
 * ```
 */
export function formatFixedPoint(decoded: DecodedFixedPointTypeNode, options: FormatOptions = {}): string {
    const node = getLastNodeFromPath(decoded.path);
    const base = node.base ?? 10;
    const { signedness, totalBits } = getIntegerLayout(node.number.format);
    const text =
        base === 2
            ? formatBinary(rawBinaryFixedPoint(signedness, totalBits, node.scale)(decoded.value), options)
            : formatDecimal(rawDecimalFixedPoint(signedness, totalBits, node.scale)(decoded.value), options);
    return withUnit(text, getDisplayUnit(decoded.path, node.display, options) ?? node.unit, options);
}

/**
 * Format a decoded date-time, a number of ticks since the Unix epoch, as an ISO 8601 UTC
 * date-time, exact for any year. Years beyond `0000`–`9999` use the expanded form of
 * `Date.prototype.toISOString`, e.g. `+275761` or `-000001`. Fractions of a second are shown
 * when not zero, exactly when `ticksPerSecond` is a power of 10 and rounded to the
 * nanosecond otherwise.
 *
 * @throws `CODAMA_ERROR__INVALID_TICKS_PER_SECOND` when `ticksPerSecond` is not a positive integer.
 *
 * @example
 * ```ts
 * formatDateTime(decoded); // "2024-01-01T00:00:00Z"
 * ```
 */
export function formatDateTime(decoded: DecodedDateTimeTypeNode, _options: FormatOptions = {}): string {
    const time = toSeconds(decoded.value, decoded.path);
    const days = floorDiv(time.seconds, SECONDS_PER_DAY);
    const secondsOfDay = time.seconds - days * SECONDS_PER_DAY;
    const [year, month, day] = getCivilDate(days);
    const date = `${formatYear(year)}-${pad(month)}-${pad(day)}`;
    return `${date}T${formatClock(secondsOfDay)}${time.fraction}Z`;
}

/**
 * Format a decoded duration, a number of ticks, as `HH:mm:ss`, hours going beyond 24 when
 * needed, e.g. `"49:00:00"`, with a leading `-` when negative. Fractions of a second are shown
 * as for {@link formatDateTime}.
 *
 * @throws `CODAMA_ERROR__INVALID_TICKS_PER_SECOND` when `ticksPerSecond` is not a positive integer.
 *
 * @example
 * ```ts
 * formatDuration(decoded); // "01:30:00"
 * ```
 */
export function formatDuration(decoded: DecodedDurationTypeNode, _options: FormatOptions = {}): string {
    const negative = decoded.value < 0n;
    const time = toSeconds(negative ? -decoded.value : decoded.value, decoded.path);
    return `${negative ? '-' : ''}${formatClock(time.seconds)}${time.fraction}`;
}

/**
 * Format a decoded string, sliced to the `[sliceStart, sliceEnd)` range of its display node,
 * if any. Indices count Unicode code points, so a slice never splits a character such as an
 * emoji.
 *
 * @example
 * ```ts
 * // stringTypeNode('utf8', { display: stringDisplayNode({ sliceEnd: 4 }) })
 * formatString(decoded); // "abcd"
 * ```
 */
export function formatString(decoded: DecodedStringTypeNode, _options: FormatOptions = {}): string {
    const display = getLastNodeFromPath(decoded.path).display;
    if (!display) return decoded.value;
    return Array.from(decoded.value)
        .slice(display.sliceStart ?? 0, display.sliceEnd)
        .join('');
}

/**
 * Format a decoded boolean as `"true"` or `"false"`.
 *
 * @example
 * ```ts
 * formatBoolean(decoded); // "true"
 * ```
 */
export function formatBoolean(decoded: DecodedBooleanTypeNode, _options: FormatOptions = {}): string {
    return decoded.value ? 'true' : 'false';
}

/**
 * Format decoded bytes as hexadecimal with a `0x` prefix, whatever the encoding they were
 * decoded with, e.g. `["base64", "AQI="]` gives `"0x0102"`. Bytes decoded as `utf8` are
 * re-encoded from their text, so invalid UTF-8 sequences, already replaced when decoding, are
 * not recovered: decode bytes with another encoding to format them exactly.
 *
 * @example
 * ```ts
 * formatBytes(decoded); // "0x0102"
 * ```
 */
export function formatBytes(decoded: DecodedBytesTypeNode, _options: FormatOptions = {}): string {
    const [encoding, data] = decoded.value;
    return `0x${getBase16Decoder().decode(getCodecFromBytesEncoding(encoding).encode(data))}`;
}

/**
 * Format a decoded enum as the label of its variant's display node, or the identifier of its
 * variant in title case otherwise, e.g. `"Move To"` for `moveTo`. The data of the variant, if
 * any, is not included.
 *
 * @example
 * ```ts
 * // enumVariantTypeNode('moveTo', { display: enumVariantDisplayNode({ label: 'Move' }) })
 * formatEnum(decoded); // "Move"
 * ```
 */
export function formatEnum(decoded: DecodedEnumTypeNode, _options: FormatOptions = {}): string {
    return getEnumVariantLabel(decoded.variant);
}

/**
 * Format a decoded public key with `formatAddress`, if any, or as its address otherwise.
 *
 * @example
 * ```ts
 * formatPublicKey(decoded); // "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
 * formatPublicKey(decoded, { formatAddress: address => names.get(address) ?? address }); // "USDC"
 * ```
 */
export function formatPublicKey(decoded: DecodedPublicKeyTypeNode, options: FormatOptions = {}): string {
    return options.formatAddress ? options.formatAddress(decoded.value) : decoded.value;
}

const SECONDS_PER_DAY = 86_400n;

/** The signedness and bit width of an integer format, for Kit's fixed points. */
function getIntegerLayout(format: IntegerFormat): { signedness: Signedness; totalBits: number } {
    // `shortU16` is a variable-size encoding of an unsigned 16-bit integer.
    if (format === 'shortU16') return { signedness: 'unsigned', totalBits: 16 };
    return { signedness: format.startsWith('i') ? 'signed' : 'unsigned', totalBits: Number(format.slice(1)) };
}

function formatDecimal(value: DecimalFixedPoint<Signedness, number, number>, options: FormatOptions): string {
    return options.numberFormat
        ? formatDecimalFixedPoint(options.numberFormat, value)
        : decimalFixedPointToString(value);
}

function formatBinary(value: BinaryFixedPoint<Signedness, number, number>, options: FormatOptions): string {
    return options.numberFormat ? formatBinaryFixedPoint(options.numberFormat, value) : binaryFixedPointToString(value);
}

function withUnit(text: string, unit: string | undefined, options: FormatOptions): string {
    if (!unit) return text;
    return (options.formatUnit ?? formatUnit)(text, unit);
}

/** The unit of a number's display node, if it has one that resolves. */
function getDisplayUnit(
    path: NodePath,
    display: AmountNumberDisplayNode | UnitNumberDisplayNode | undefined,
    options: FormatOptions,
): string | undefined {
    if (!display?.unit) return undefined;
    return resolveStringInput(path, display, display.unit, options);
}

/** A non-negative integer input of a display node, e.g. the `decimals` of an amount, if it resolves. */
function resolveIntegerInput(
    path: NodePath,
    display: Node,
    input: InjectableIntegerValueNode,
    options: FormatOptions,
): number | undefined {
    const value: unknown = isNode(input, 'integerValueNode')
        ? BigInt(input.value)
        : options.resolveInjectedValue?.([...path, display, input]);
    if (typeof value === 'bigint' && value >= 0n && value <= BigInt(Number.MAX_SAFE_INTEGER)) return Number(value);
    if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return value;
    return undefined;
}

/** A non-empty string input of a display node, e.g. the `unit` of an amount, if it resolves. */
function resolveStringInput(
    path: NodePath,
    display: Node,
    input: InjectableStringValueNode,
    options: FormatOptions,
): string | undefined {
    const value: unknown = isNode(input, 'stringValueNode')
        ? input.string
        : options.resolveInjectedValue?.([...path, display, input]);
    return typeof value === 'string' && value !== '' ? value : undefined;
}

/**
 * Split a non-negative number of ticks of a date-time or duration into whole seconds and the
 * fraction of a second, e.g. `".5"`. Ticks that are not powers of 10 of a second are rounded to
 * the nanosecond.
 */
function toSeconds(
    ticks: bigint,
    path: NodePath<DateTimeTypeNode | DurationTypeNode>,
): { fraction: string; seconds: bigint } {
    const ticksPerSecond = getLastNodeFromPath(path).ticksPerSecond ?? 1;
    if (!Number.isSafeInteger(ticksPerSecond) || ticksPerSecond <= 0) {
        throw new CodamaError(CODAMA_ERROR__INVALID_TICKS_PER_SECOND, { path, ticksPerSecond });
    }
    let perSecond = BigInt(ticksPerSecond);
    let digits = getPowerOfTen(perSecond);
    if (digits === undefined) {
        // Round to the nearest nanosecond, halves away from zero.
        const nanoseconds = ticks * 1_000_000_000n;
        const half = nanoseconds < 0n ? -perSecond / 2n : perSecond / 2n;
        ticks = (nanoseconds + half) / perSecond;
        perSecond = 1_000_000_000n;
        digits = 9;
    }
    const seconds = floorDiv(ticks, perSecond);
    const remainder = ticks - seconds * perSecond;
    const fraction = remainder === 0n ? '' : `.${remainder.toString().padStart(digits, '0').replace(/0+$/, '')}`;
    return { fraction, seconds };
}

/** The number of zeros of a power of 10, e.g. 3 for 1000, if it is one. */
function getPowerOfTen(value: bigint): number | undefined {
    const digits = value.toString();
    return /^10*$/.test(digits) ? digits.length - 1 : undefined;
}

function floorDiv(dividend: bigint, divisor: bigint): bigint {
    const quotient = dividend / divisor;
    return dividend % divisor !== 0n && dividend < 0n !== divisor < 0n ? quotient - 1n : quotient;
}

/**
 * The proleptic Gregorian year, month and day of a number of days since the Unix epoch,
 * using Howard Hinnant's `civil_from_days` algorithm, exact for any number of days.
 */
function getCivilDate(daysSinceEpoch: bigint): [year: bigint, month: bigint, day: bigint] {
    const days = daysSinceEpoch + 719_468n;
    const era = floorDiv(days, 146_097n);
    const dayOfEra = days - era * 146_097n;
    const yearOfEra = (dayOfEra - dayOfEra / 1_460n + dayOfEra / 36_524n - dayOfEra / 146_096n) / 365n;
    const dayOfYear = dayOfEra - (365n * yearOfEra + yearOfEra / 4n - yearOfEra / 100n);
    const shiftedMonth = (5n * dayOfYear + 2n) / 153n;
    const day = dayOfYear - (153n * shiftedMonth + 2n) / 5n + 1n;
    const month = shiftedMonth < 10n ? shiftedMonth + 3n : shiftedMonth - 9n;
    const year = yearOfEra + era * 400n + (month <= 2n ? 1n : 0n);
    return [year, month, day];
}

/** An ISO 8601 year: 4 digits within `0000`–`9999`, and a sign with at least 6 digits otherwise. */
function formatYear(year: bigint): string {
    if (year >= 0n && year <= 9999n) return year.toString().padStart(4, '0');
    return `${year < 0n ? '-' : '+'}${(year < 0n ? -year : year).toString().padStart(6, '0')}`;
}

/** `HH:mm:ss` for a non-negative number of seconds, hours going beyond 24 when needed. */
function formatClock(totalSeconds: bigint): string {
    const hours = totalSeconds / 3_600n;
    const minutes = (totalSeconds % 3_600n) / 60n;
    const seconds = totalSeconds % 60n;
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function pad(value: bigint): string {
    return value.toString().padStart(2, '0');
}
