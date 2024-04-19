export interface BooleanValueNode {
    readonly kind: 'booleanValueNode';

    // Data.
    readonly boolean: boolean;
}
