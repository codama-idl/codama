import type { CodamaVersion } from '@codama/node-types';

/**
 * The Codama spec version this package was generated against.
 *
 * Pinned to the spec version of `@codama/spec` at generation time
 * (pre-release metadata stripped — this names the spec shape, not
 * the npm package version). Used by `rootNode()` to tag the IDL and
 * by downstream consumers that need to compare an IDL's `version`
 * against the spec shape `@codama/nodes` understands.
 */
export const CODAMA_VERSION: CodamaVersion = '2.0.0';
