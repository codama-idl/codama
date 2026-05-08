/** The byte order of a numeric serialization. */
export type Endianness =
    /** Big-endian: the most significant byte is written first. */
    | 'be'
    /** Little-endian: the least significant byte is written first. */
    | 'le';
