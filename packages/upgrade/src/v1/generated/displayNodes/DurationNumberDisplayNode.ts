/**
 * Display metadata that presents a number as an elapsed duration.
 * The underlying value counts ticks; `ticksPerSecond` is the divisor that converts those ticks back to seconds.
 * Renderers typically format the result as `HH:mm:ss` or a coarser human-readable form.
 */
export interface DurationNumberDisplayNode {
    readonly kind: 'durationNumberDisplayNode';

    // Data.
    /**
     * How many ticks make one second. Defaults to `1` (the value is already in seconds).
     * Common choices are `1000` (milliseconds), `1000000` (microseconds), and `1000000000` (nanoseconds).
     */
    readonly ticksPerSecond?: number;
}
