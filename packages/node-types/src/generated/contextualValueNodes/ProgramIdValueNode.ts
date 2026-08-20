/** Refers to the program ID of the surrounding instruction — that is, the address of the `programNode` this node descends from. */
export interface ProgramIdValueNode {
    readonly kind: 'programIdValueNode';
}
