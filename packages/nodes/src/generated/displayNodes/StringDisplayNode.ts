import type { StringDisplayNode } from '@codama/node-types';

export type StringDisplayNodeInput = Omit<StringDisplayNode, 'kind'>;

/**
 * Display metadata for a string value.
 * The string's wire encoding is carried by `stringTypeNode.encoding`; this node only addresses presentation.
 */
export function stringDisplayNode(input: StringDisplayNodeInput): StringDisplayNode {
    return Object.freeze({
        kind: 'stringDisplayNode',

        // Data.
        ...(input.sliceStart !== undefined && { sliceStart: input.sliceStart }),
        ...(input.sliceEnd !== undefined && { sliceEnd: input.sliceEnd }),
    });
}
