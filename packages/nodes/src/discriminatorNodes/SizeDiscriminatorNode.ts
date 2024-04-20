import type { SizeDiscriminatorNode } from '@kinobi-so/node-types';

export function sizeDiscriminatorNode(size: number): SizeDiscriminatorNode {
    return Object.freeze({
        kind: 'sizeDiscriminatorNode',

        // Data.
        size,
    });
}
