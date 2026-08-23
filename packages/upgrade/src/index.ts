/**
 * `@codama/upgrade` — public API.
 *
 * Upgrades Codama IDLs of any supported major to the latest major via
 * an append-only chain of pure, single-major upgrade functions. The frozen
 * node types of older majors are exposed under the `v1` (etc.) type-only
 * namespaces.
 */
export * from './upgrade';
export * from './upgradeFromJson';
export * from './upgradeToLatestVisitor';
export { upgradeToLatestVisitor as default } from './upgradeToLatestVisitor';

export type * as v1 from './v1';
