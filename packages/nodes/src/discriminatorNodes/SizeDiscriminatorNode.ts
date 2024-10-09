import type { SizeDiscriminatorNode } from '@codama/node-types';

export function sizeDiscriminatorNode(size: number): SizeDiscriminatorNode {
    return Object.freeze({
        kind: 'sizeDiscriminatorNode',

        // Data.
        size,
    });
}
