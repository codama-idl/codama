import type { CodamaVersion } from '@codama/node-types';

/**
 * The Codama spec version this package was generated against.
 *
 * Pinned to the literal version of `@codama/spec` at generation time.
 * Used by `rootNode()` to tag the IDL and by downstream consumers
 * that need to compare an IDL's `version` against the spec
 * shape `@codama/nodes` understands.
 */
export const CODAMA_VERSION: CodamaVersion = '1.9.2';
