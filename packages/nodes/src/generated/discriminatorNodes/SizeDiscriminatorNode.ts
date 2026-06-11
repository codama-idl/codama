import type { SizeDiscriminatorNode } from '@codama/node-types';

/** Identifies a node by its expected total byte size. */
export function sizeDiscriminatorNode(size: number): SizeDiscriminatorNode {
    return Object.freeze({
        kind: 'sizeDiscriminatorNode',

        // Data.
        size,
    });
}
