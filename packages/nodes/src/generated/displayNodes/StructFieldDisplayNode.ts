import type { StructFieldDisplayNode } from '@codama/node-types';

export type StructFieldDisplayNodeInput = Omit<StructFieldDisplayNode, 'kind'>;

/**
 * Display metadata for a named member: its label, whether it is shown in the fallback list, and whether it is flattened into its parent.
 * Value presentation is carried by the member's type; this node only addresses naming and composition.
 */
export function structFieldDisplayNode(input: StructFieldDisplayNodeInput): StructFieldDisplayNode {
    return Object.freeze({
        kind: 'structFieldDisplayNode',

        // Data.
        ...(input.label !== undefined && { label: input.label }),
        ...(input.skip !== undefined && { skip: input.skip }),
        ...(input.flatten !== undefined && { flatten: input.flatten }),
        ...(input.flattenPrefix !== undefined && { flattenPrefix: input.flattenPrefix }),
    });
}
