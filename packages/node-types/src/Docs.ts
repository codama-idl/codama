/**
 * Hand-written `Docs` alias used by every `docs?` field in the generated
 * node-type surface.
 *
 * Lives outside `./generated/` because it's a static type alias — there's
 * nothing the spec contributes beyond the array shape itself. The
 * generator's symbol map points at this file when emitting `import type
 * { Docs } from '../Docs';` lines.
 */

/** Markdown documentation for a node — one paragraph per array entry. */
export type Docs = Array<string>;
