import { isNode, type Node, type NodeKind } from '@codama/nodes';

import { interceptFirstVisitVisitor } from './interceptFirstVisitVisitor';
import { interceptVisitor } from './interceptVisitor';
import { LINKABLE_NODES, LinkableDictionary } from './LinkableDictionary';
import { NodeStack } from './NodeStack';
import { pipe } from './pipe';
import { recordNodeStackVisitor } from './recordNodeStackVisitor';
import { visit, Visitor } from './visitor';
import { voidVisitor } from './voidVisitor';

/**
 * Record the linkable nodes of the tree under the given node, e.g. a root node, into a new
 * `LinkableDictionary`. Use it in entry points, then pass the dictionary to the functions they
 * compose, so the tree is only walked once.
 *
 * @example
 * ```ts
 * const linkables = getLinkablesFromNode(root);
 * resolveTypePath([root, program, instruction, instruction.data], pathString('config.fee'), linkables);
 * ```
 */
export function getLinkablesFromNode(node: Node): LinkableDictionary {
    const linkables = new LinkableDictionary();
    visit(node, getRecordLinkablesVisitor(linkables));
    return linkables;
}

export function getRecordLinkablesVisitor<TNodeKind extends NodeKind>(
    linkables: LinkableDictionary,
): Visitor<void, TNodeKind> {
    const stack = new NodeStack();
    return pipe(
        voidVisitor(),
        v =>
            interceptVisitor(v, (node, next) => {
                if (isNode(node, LINKABLE_NODES)) {
                    linkables.recordPath(stack.getPath(LINKABLE_NODES));
                }
                return next(node);
            }),
        v => recordNodeStackVisitor(v, stack),
    );
}

export function recordLinkablesOnFirstVisitVisitor<TReturn, TNodeKind extends NodeKind>(
    visitor: Visitor<TReturn, TNodeKind>,
    linkables: LinkableDictionary,
): Visitor<TReturn, TNodeKind> {
    const recordingVisitor = getRecordLinkablesVisitor(linkables);

    return pipe(visitor, v =>
        interceptFirstVisitVisitor(v, (node, next) => {
            visit(node, recordingVisitor);
            return next(node);
        }),
    );
}
