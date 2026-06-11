/**
 * Hand-written `Version` alias — a semver-shaped template-literal type
 * used wherever the generated surface needs to validate that a string
 * looks like a version number.
 *
 * Lives outside `./generated/` because it's static. The per-spec
 * `CodamaVersion` literal — which pins to the spec version at generation
 * time — stays under `./generated/shared/`.
 */

/** A semver-shaped version string (e.g. "1.6.0"). */
export type Version = `${number}.${number}.${number}`;
