/** The toolchain that originally generated a program description. */
export type ProgramOrigin =
    /** The program was originally described by an Anchor IDL. */
    | 'anchor'
    /** The program was originally described by a Shank IDL. */
    | 'shank';
