/** How an absent optional account is represented when serialising an instruction. */
export type OptionalAccountStrategy =
    /** The account slot is left out of the instruction entirely. Subsequent accounts shift up. */
    | 'omitted'
    /** The account slot is filled with the program ID as a placeholder, preserving positional indices. */
    | 'programId';
