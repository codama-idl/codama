import type { CamelCaseString } from '../../brands';

/** Identifies a node by the value of a named field at a known byte offset. */
export interface FieldDiscriminatorNode {
    readonly kind: 'fieldDiscriminatorNode';

    // Data.
    /** The name of the discriminating field — a `structFieldTypeNode` of the account data or an argument of the instruction. */
    readonly name: CamelCaseString;
    /** The byte offset of the field. */
    readonly offset: number;
}
