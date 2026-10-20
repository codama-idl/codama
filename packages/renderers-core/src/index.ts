/**
 * `@codama/renderers-core`: public API.
 *
 * The renderer-specific visitors built on top of `@codama/fragments`:
 * {@link writeRenderMapVisitor} and {@link writeIdlVisitor}, the pieces
 * that pull in the visitor and node infrastructure. Fragment primitives,
 * casing helpers, path and filesystem helpers, and the `RenderMap` data
 * operations are not re-exported here; import them from
 * `@codama/fragments` directly.
 */

export * from './renderMap';
export * from './writeIdlVisitor';
