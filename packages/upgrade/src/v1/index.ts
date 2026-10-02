/**
 * The v1 Codama node types, as consumed by the v1 to v2 upgrade.
 *
 * These are the published types of the last v1 release, installed under the
 * `@codama/node-types-v1` alias and pinned exactly, so they never change
 * unless the pin is deliberately moved.
 *
 * Everything in here is compile-time only and adds zero runtime bytes.
 */
export type * from '@codama/node-types-v1';
