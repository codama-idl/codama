/**
 * The v2 Codama node types, as produced by the v1 to v2 upgrade.
 *
 * While v2 is the latest major, this re-exports `@codama/node-types`. Once
 * v3 ships, it must be replaced by a frozen static copy of the v2 node types,
 * as done for `../v1`, so the v1 to v2 upgrade keeps producing v2 nodes.
 *
 * Everything in here is compile-time only and adds zero runtime bytes.
 */
export type * from '@codama/node-types';
