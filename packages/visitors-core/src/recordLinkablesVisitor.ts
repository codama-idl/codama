import { isNode, type NodeKind } from '@kinobi-so/nodes';

import { interceptFirstVisitVisitor } from './interceptFirstVisitVisitor';
import { interceptVisitor } from './interceptVisitor';
import { LINKABLE_NODES, LinkableDictionary } from './LinkableDictionary';
import { visit, Visitor } from './visitor';
import { voidVisitor } from './voidVisitor';

export function recordLinkablesVisitor<TReturn, TNodeKind extends NodeKind>(
    visitor: Visitor<TReturn, TNodeKind>,
    linkables: LinkableDictionary,
): Visitor<TReturn, TNodeKind> {
    const recordingVisitor = interceptVisitor(voidVisitor(), (node, next) => {
        if (isNode(node, LINKABLE_NODES)) {
            linkables.record(node);
        }
        return next(node);
    });

    return interceptFirstVisitVisitor(visitor, (node, next) => {
        visit(node, recordingVisitor);
        return next(node);
    });
}
