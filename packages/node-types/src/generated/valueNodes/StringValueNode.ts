/** A concrete string value. */
export interface StringValueNode {
    readonly kind: 'stringValueNode';

    // Data.
    /** The string value. */
    readonly string: string;
}
