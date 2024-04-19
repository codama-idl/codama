export interface StringValueNode {
    readonly kind: 'stringValueNode';

    // Data.
    readonly string: string;
}
