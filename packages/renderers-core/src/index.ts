/**
 * `@codama/renderers-core` — public API.
 *
 * The bulk of the surface is re-exported from `@codama/fragments`:
 * fragment primitives, casing helpers, path / filesystem helpers, and
 * the `RenderMap` data operations all live there so they can be shared
 * with code generators and other consumers outside the renderers
 * stack. This package layers the renderer-specific
 * {@link writeRenderMapVisitor} on top — the one piece that pulls in
 * the visitor + node infrastructure.
 */

export * from '@codama/fragments';
export * from './renderMap';
