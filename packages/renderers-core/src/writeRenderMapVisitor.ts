import { NodeKind } from '@kinobi-so/nodes';
import { mapVisitor, Visitor } from '@kinobi-so/visitors-core';

import { RenderMap } from './RenderMap';

export function writeRenderMapVisitor<TNodeKind extends NodeKind = NodeKind>(
    visitor: Visitor<RenderMap, TNodeKind>,
    path: string,
): Visitor<void, TNodeKind> {
    return mapVisitor(visitor, renderMap => renderMap.write(path));
}
