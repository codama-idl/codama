/**
 * Frozen static snapshot of the v1 Codama node types.
 *
 * The `./generated` directory is a hand-maintained static copy of the v1
 * node types as published at `@codama/spec@1.9.2` — it is NOT regenerated
 * by `pnpm generate` (the generator is single-major and only renders the
 * spec on its own branch). Its layout deliberately mirrors the `1.x`
 * branch's `@codama/node-types/src/generated`, so a change to a past major
 * can be ported forward by applying the same patch here. The hand-written
 * siblings (`brands`, `Docs`, `Version`) are frozen v1-shaped copies of
 * their `@codama/node-types` counterparts, keeping the snapshot fully
 * self-contained. See `./README.md`.
 *
 * Everything in here is compile-time only: types are erased from the built
 * output, so this snapshot adds zero runtime bytes.
 */
export * from './brands';
export * from './Docs';
export * from './generated';
export * from './Version';
