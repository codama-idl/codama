/**
 * A concrete numeric value.
 * Stored as a 64-bit float; consumers narrow to a specific integer or float width based on the surrounding type context.
 */
export interface NumberValueNode {
    readonly kind: 'numberValueNode';

    // Data.
    /** The numeric value. */
    readonly number: number;
}
