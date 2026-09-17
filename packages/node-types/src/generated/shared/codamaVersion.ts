/**
 * The shape of Codama spec versions this package describes. Pinned to the
 * spec major at generation time; IDLs conforming to any minor or patch
 * of that major carry a string of this shape.
 */
export type CodamaVersion = `2.${number}.${number}`;
