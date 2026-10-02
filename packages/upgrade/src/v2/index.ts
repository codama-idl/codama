/**
 * The v2 Codama node types, as produced by the v1 to v2 upgrade.
 *
 * While v2 is the latest major, this re-exports the workspace's
 * `@codama/node-types`. Once v3 ships, it must re-export an exactly pinned
 * `@codama/node-types-v2` alias of the last v2 release instead, as `../v1`
 * does, so the v1 to v2 upgrade keeps producing v2 nodes.
 *
 * Everything in here is compile-time only and adds zero runtime bytes.
 */
export type * from '@codama/node-types';
