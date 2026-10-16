import type { CodamaVersion } from '@codama/node-types';
import { CODAMA_VERSION } from '@codama/nodes';

/**
 * The v2 Codama node types, as produced by the v1 to v2 upgrade.
 *
 * While v2 is the latest major, this re-exports the workspace's
 * `@codama/node-types`. Once v3 ships, it must re-export an exactly pinned
 * `@codama/node-types-v2` alias of the last v2 release instead, as `../v1`
 * does, so the v1 to v2 upgrade keeps producing v2 nodes.
 *
 * The types are compile-time only and add zero runtime bytes.
 */
export type * from '@codama/node-types';

/**
 * The latest v2 spec version, stamped by `upgradeV1ToV2` on the IDLs it
 * produces.
 *
 * While v2 is the latest major, this is `CODAMA_VERSION`. Once v3 ships, it
 * must be replaced by the literal version of the last v2 spec release.
 */
export const V2_VERSION: CodamaVersion = CODAMA_VERSION;
