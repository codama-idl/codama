/** Identifies a node by its expected total byte size. */
export interface SizeDiscriminatorNode {
    readonly kind: 'sizeDiscriminatorNode';

    // Data.
    /** The expected byte size. */
    readonly size: number;
}
