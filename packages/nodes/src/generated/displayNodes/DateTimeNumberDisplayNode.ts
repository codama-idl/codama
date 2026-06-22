import type { DateTimeNumberDisplayNode } from '@codama/node-types';

export type DateTimeNumberDisplayNodeInput = Omit<DateTimeNumberDisplayNode, 'kind'>;

/**
 * Display metadata that presents a number as a point in time.
 * The underlying value counts ticks since the Unix epoch; `ticksPerSecond` is the divisor that converts those ticks back to seconds.
 */
export function dateTimeNumberDisplayNode(input: DateTimeNumberDisplayNodeInput): DateTimeNumberDisplayNode {
    return Object.freeze({
        kind: 'dateTimeNumberDisplayNode',

        // Data.
        ...(input.ticksPerSecond !== undefined && { ticksPerSecond: input.ticksPerSecond }),
    });
}
