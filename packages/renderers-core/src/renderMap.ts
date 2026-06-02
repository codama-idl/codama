/**
 * Renderer-specific helper layered on top of `@codama/fragments`'s
 * {@link RenderMap} data structure. The pure data operations live in
 * `@codama/fragments` so they can be shared with consumers outside the
 * renderers stack; this file adds the one piece that fragments cannot
 * pull in — the visitor wrapper, which depends on the visitor + node
 * infrastructure.
 */

import { type BaseFragment, type Path, type RenderMap, writeRenderMap } from '@codama/fragments';
import { NodeKind } from '@codama/nodes';
import { mapVisitor, Visitor } from '@codama/visitors-core';

/**
 * Wrap a {@link Visitor} that produces a {@link RenderMap} so the
 * resulting map is written to disk under `basePath` once the visit
 * completes.
 */
export function writeRenderMapVisitor<
    TFragment extends BaseFragment = BaseFragment,
    TNodeKind extends NodeKind = NodeKind,
>(visitor: Visitor<RenderMap<TFragment>, TNodeKind>, basePath: Path): Visitor<void, TNodeKind> {
    return mapVisitor(visitor, renderMap => writeRenderMap(renderMap, basePath));
}
