import type { CamelCaseString } from '../../brands';

/** Refers to a named argument of the surrounding instruction. */
export interface ArgumentValueNode {
    readonly kind: 'argumentValueNode';

    // Data.
    /** The name of the referenced argument. */
    readonly name: CamelCaseString;
}
