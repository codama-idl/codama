import { isNode, type NodeKind } from '@codama/nodes';

import { interceptVisitor } from './interceptVisitor';
import { ProvidedScope } from './ProvidedScope';
import { Visitor } from './visitor';

/**
 * Keep a {@link ProvidedScope} in sync with the traversal: every
 * `instructionNode` with `provides` opens a frame for the duration of its
 * visit, so injections within it (and its sub-instructions) resolve
 * against the instructions enclosing them.
 */
export function recordProvidedScopeVisitor<TReturn, TNodeKind extends NodeKind>(
    visitor: Visitor<TReturn, TNodeKind>,
    scope: ProvidedScope,
): Visitor<TReturn, TNodeKind> {
    return interceptVisitor(visitor, (node, next) => {
        if (!isNode(node, 'instructionNode') || (node.provides ?? []).length === 0) {
            return next(node);
        }
        scope.push(node.provides ?? []);
        try {
            return next(node);
        } finally {
            scope.pop();
        }
    });
}
