import { NodeKind } from '@codama/nodes';
import { mapVisitor, Visitor } from '@codama/visitors-core';

import { RenderMap } from './renderMap';

export function writeRenderMapVisitor<TNodeKind extends NodeKind = NodeKind>(
    visitor: Visitor<RenderMap, TNodeKind>,
    path: string,
): Visitor<void, TNodeKind> {
    return mapVisitor(visitor, renderMap => renderMap.write(path));
}
