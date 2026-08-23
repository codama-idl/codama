/**
 * The "absent" value for an optional type.
 * For instance, this can be set as the default value of a field whose type is an `optionTypeNode`.
 */
export interface NoneValueNode {
    readonly kind: 'noneValueNode';
}
