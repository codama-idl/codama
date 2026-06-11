import type { Version } from './Version';

/**
 * Hand-written compatibility alias for the program version string.
 *
 * @deprecated Use `Version` instead. This alias is kept so existing
 * imports continue to compile and will be removed in a future major
 * release.
 */
export type ProgramVersion = Version;
