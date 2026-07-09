/**
 * Display metadata that presents a number as a point in time.
 * The underlying value counts ticks since the Unix epoch; `ticksPerSecond` is the divisor that converts those ticks back to seconds.
 */
export interface DateTimeNumberDisplayNode {
    readonly kind: 'dateTimeNumberDisplayNode';

    // Data.
    /**
     * How many ticks make one second. Defaults to `1` (the value is already in seconds).
     * Common choices are `1000` (milliseconds), `1000000` (microseconds), and `1000000000` (nanoseconds).
     */
    readonly ticksPerSecond?: number;
}
