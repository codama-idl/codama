/**
 * Frozen snapshot of the v1 Codama node types.
 *
 * The `./generated` directory is produced by `pnpm generate` from the
 * `@codama/spec-v1` aliased pin of `@codama-internal/spec-generators`, so
 * it only changes when that pin — or the generator code — deliberately
 * changes. The hand-written siblings (`brands`, `Docs`, `Version`) are
 * frozen copies of their `@codama/node-types` counterparts.
 *
 * Everything in here is compile-time only: types are erased from the built
 * output, so this snapshot adds zero runtime bytes.
 */
export * from './brands';
export * from './Docs';
export * from './generated';
export * from './Version';
