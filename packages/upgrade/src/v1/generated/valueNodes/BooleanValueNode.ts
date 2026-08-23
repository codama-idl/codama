/** A concrete boolean value. */
export interface BooleanValueNode {
    readonly kind: 'booleanValueNode';

    // Data.
    /** The boolean value. */
    readonly boolean: boolean;
}
