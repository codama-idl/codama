import type { DurationNumberDisplayNode } from '@codama/node-types';

export type DurationNumberDisplayNodeInput = Omit<DurationNumberDisplayNode, 'kind'>;

/**
 * Display metadata that presents a number as an elapsed duration.
 * The underlying value counts ticks; `ticksPerSecond` is the divisor that converts those ticks back to seconds.
 * Renderers typically format the result as `HH:mm:ss` or a coarser human-readable form.
 */
export function durationNumberDisplayNode(input: DurationNumberDisplayNodeInput): DurationNumberDisplayNode {
    return Object.freeze({
        kind: 'durationNumberDisplayNode',

        // Data.
        ...(input.ticksPerSecond !== undefined && { ticksPerSecond: input.ticksPerSecond }),
    });
}
